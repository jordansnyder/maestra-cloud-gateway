"""Site management endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import audit
from database import get_db
from models.database import AuditAction, Site, SiteStatus
from models.schemas import (
    SiteCreate,
    SiteResponse,
    SiteStatusEnum,
    SiteStatusResponse,
    SiteUpdate,
)

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[SiteResponse])
async def list_sites(
    status: Optional[SiteStatusEnum] = None,
    region: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all registered sites with optional filtering."""
    query = select(Site).order_by(Site.created_at.desc()).limit(limit).offset(offset)

    if status:
        query = query.where(Site.status == status.value)
    if region:
        query = query.where(Site.region == region)
    if tag:
        query = query.where(Site.tags.contains([tag]))

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/count")
async def count_sites(db: AsyncSession = Depends(get_db)):
    """Get site counts by status."""
    result = await db.execute(
        select(Site.status, func.count(Site.id)).group_by(Site.status)
    )
    counts = {row[0].value if hasattr(row[0], "value") else row[0]: row[1] for row in result}
    return {"total": sum(counts.values()), "by_status": counts}


@router.post("", response_model=SiteResponse, status_code=201)
async def create_site(
    site: SiteCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new Maestra site."""
    # Check for duplicate slug
    existing = await db.execute(select(Site).where(Site.slug == site.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Site with slug '{site.slug}' already exists")

    db_site = Site(
        name=site.name,
        slug=site.slug,
        description=site.description,
        region=site.region,
        latitude=site.latitude,
        longitude=site.longitude,
        timezone=site.timezone,
        site_metadata=site.metadata or {},
        tags=site.tags or [],
        status=SiteStatus.PENDING,
        nats_account=f"SITE_{site.slug.upper().replace('-', '_')}",
    )
    db.add(db_site)
    await db.commit()
    await db.refresh(db_site)

    await audit.log(
        db,
        AuditAction.SITE_CREATED,
        resource_type="site",
        resource_id=str(db_site.id),
        site_id=db_site.id,
        details={"slug": site.slug, "region": site.region},
    )
    await db.commit()

    return db_site


@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a site by ID."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.put("/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: UUID,
    update: SiteUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a site's configuration."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    update_data = update.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["site_metadata"] = update_data.pop("metadata")

    for key, value in update_data.items():
        setattr(site, key, value)

    await db.commit()
    await db.refresh(site)

    await audit.log(
        db,
        AuditAction.SITE_UPDATED,
        resource_type="site",
        resource_id=str(site_id),
        site_id=site_id,
        details={"updated_fields": list(update_data.keys())},
    )
    await db.commit()

    return site


@router.post("/{site_id}/activate", response_model=SiteResponse)
async def activate_site(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Activate a pending site."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if site.status not in (SiteStatus.PENDING, SiteStatus.SUSPENDED):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot activate site with status '{site.status.value}'",
        )

    site.status = SiteStatus.ACTIVE
    await db.commit()
    await db.refresh(site)

    await audit.log(
        db,
        AuditAction.SITE_UPDATED,
        resource_type="site",
        resource_id=str(site_id),
        site_id=site_id,
        details={"action": "activated", "previous_status": "pending"},
    )
    await db.commit()

    return site


@router.post("/{site_id}/suspend", response_model=SiteResponse)
async def suspend_site(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Suspend an active site — agent will be disconnected."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    site.status = SiteStatus.SUSPENDED
    await db.commit()
    await db.refresh(site)

    await audit.log(
        db,
        AuditAction.SITE_SUSPENDED,
        resource_type="site",
        resource_id=str(site_id),
        site_id=site_id,
    )
    await db.commit()

    return site


@router.post("/{site_id}/revoke", response_model=SiteResponse)
async def revoke_site(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Permanently revoke a site — all certs invalidated."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    site.status = SiteStatus.REVOKED
    await db.commit()
    await db.refresh(site)

    await audit.log(
        db,
        AuditAction.SITE_REVOKED,
        resource_type="site",
        resource_id=str(site_id),
        site_id=site_id,
    )
    await db.commit()

    return site


@router.get("/{site_id}/status", response_model=SiteStatusResponse)
async def get_site_status(site_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get real-time status of a site including connection info."""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # TODO: check Redis for live connection state
    is_connected = False
    uptime = None

    return SiteStatusResponse(
        site_id=site.id,
        slug=site.slug,
        status=site.status.value,
        is_connected=is_connected,
        last_heartbeat_at=site.last_heartbeat_at,
        uptime_seconds=uptime,
        agent_version=site.agent_version,
    )
