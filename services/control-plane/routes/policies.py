"""Routing policy management endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import audit
import policy_engine
from database import get_db
from models.database import AuditAction, RoutingPolicy, Site
from models.schemas import (
    PaginatedResponse,
    PolicyCreate,
    PolicyResponse,
    PolicyTestRequest,
    PolicyTestResult,
    PolicyUpdate,
)

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("", response_model=PaginatedResponse[PolicyResponse])
async def list_policies(
    site_id: Optional[UUID] = None,
    enabled: Optional[bool] = None,
    direction: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List routing policies with optional filtering."""
    conditions = []
    if site_id:
        conditions.append(RoutingPolicy.site_id == site_id)
    if enabled is not None:
        conditions.append(RoutingPolicy.enabled == enabled)
    if direction:
        conditions.append(RoutingPolicy.direction == direction)
    if action:
        conditions.append(RoutingPolicy.action == action)

    total = await db.scalar(
        select(func.count()).select_from(RoutingPolicy).where(*conditions)
    )

    query = (
        select(RoutingPolicy)
        .where(*conditions)
        .order_by(RoutingPolicy.site_id, RoutingPolicy.priority.asc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    return {
        "items": result.scalars().all(),
        "total": total or 0,
        "limit": limit,
        "offset": offset,
    }


@router.post("/{site_id}", response_model=PolicyResponse, status_code=201)
async def create_policy(
    site_id: UUID,
    policy: PolicyCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a routing policy for a site."""
    # Verify site exists
    site_result = await db.execute(select(Site).where(Site.id == site_id))
    if not site_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Site not found")

    db_policy = RoutingPolicy(
        site_id=site_id,
        name=policy.name,
        description=policy.description,
        enabled=policy.enabled,
        priority=policy.priority,
        direction=policy.direction.value,
        action=policy.action.value,
        subject_pattern=policy.subject_pattern,
        destination_site_ids=[str(sid) for sid in policy.destination_site_ids] if policy.destination_site_ids else None,
        destination_tags=policy.destination_tags,
        source_site_ids=[str(sid) for sid in policy.source_site_ids] if policy.source_site_ids else None,
        rate_limit=policy.rate_limit,
        rate_limit_window_seconds=policy.rate_limit_window_seconds,
        sample_rate=policy.sample_rate,
        transforms=[t.model_dump() for t in policy.transforms] if policy.transforms else None,
        policy_metadata=policy.metadata or {},
    )
    db.add(db_policy)
    await db.commit()
    await db.refresh(db_policy)

    # Invalidate cache and notify agent
    await policy_engine.invalidate_cache(str(site_id))

    await audit.log(
        db,
        AuditAction.POLICY_CREATED,
        resource_type="policy",
        resource_id=str(db_policy.id),
        site_id=site_id,
        details={
            "name": policy.name,
            "direction": policy.direction.value,
            "subject_pattern": policy.subject_pattern,
        },
    )
    await db.commit()

    return db_policy


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a policy by ID."""
    result = await db.execute(select(RoutingPolicy).where(RoutingPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: UUID,
    update: PolicyUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a routing policy."""
    result = await db.execute(select(RoutingPolicy).where(RoutingPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    update_data = update.model_dump(exclude_unset=True)

    if "metadata" in update_data:
        update_data["policy_metadata"] = update_data.pop("metadata")
    if "destination_site_ids" in update_data and update_data["destination_site_ids"]:
        update_data["destination_site_ids"] = [str(sid) for sid in update_data["destination_site_ids"]]
    if "source_site_ids" in update_data and update_data["source_site_ids"]:
        update_data["source_site_ids"] = [str(sid) for sid in update_data["source_site_ids"]]
    if "transforms" in update_data and update_data["transforms"]:
        update_data["transforms"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in update_data["transforms"]]
    if "direction" in update_data:
        update_data["direction"] = update_data["direction"].value if hasattr(update_data["direction"], "value") else update_data["direction"]
    if "action" in update_data:
        update_data["action"] = update_data["action"].value if hasattr(update_data["action"], "value") else update_data["action"]

    for key, value in update_data.items():
        setattr(policy, key, value)

    policy.version += 1
    await db.commit()
    await db.refresh(policy)

    await policy_engine.invalidate_cache(str(policy.site_id))

    await audit.log(
        db,
        AuditAction.POLICY_UPDATED,
        resource_type="policy",
        resource_id=str(policy_id),
        site_id=policy.site_id,
        details={"updated_fields": list(update_data.keys()), "new_version": policy.version},
    )
    await db.commit()

    return policy


@router.delete("/{policy_id}", status_code=204)
async def delete_policy(policy_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a routing policy."""
    result = await db.execute(select(RoutingPolicy).where(RoutingPolicy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    site_id = policy.site_id
    await db.delete(policy)
    await db.commit()

    await policy_engine.invalidate_cache(str(site_id))

    await audit.log(
        db,
        AuditAction.POLICY_DELETED,
        resource_type="policy",
        resource_id=str(policy_id),
        site_id=site_id,
        details={"name": policy.name},
    )
    await db.commit()


@router.post("/test", response_model=PolicyTestResult)
async def test_policy(
    request: PolicyTestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Dry-run: evaluate a message against a site's policies without routing."""
    # TODO: get connected sites from Redis
    connected_sites: dict[str, dict] = {}

    result = await policy_engine.evaluate(
        db, request.source_site_id, request.subject, connected_sites
    )
    return result


@router.get("/site/{site_id}/compiled")
async def get_compiled_policies(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get the compiled policy configuration for a site's Cloud Agent."""
    site_result = await db.execute(select(Site).where(Site.id == site_id))
    if not site_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Site not found")

    return await policy_engine.get_site_policies_for_agent(db, site_id)
