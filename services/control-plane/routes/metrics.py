"""Metrics and monitoring endpoints."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.database import AuditLog, RoutingPolicy, Site, SiteCertificate, SiteStatus
from models.schemas import (
    AuditLogEntry,
    GatewayMetrics,
    PaginatedResponse,
    SiteThroughput,
)

router = APIRouter(tags=["metrics"])


@router.get("/metrics", response_model=GatewayMetrics)
async def get_gateway_metrics(db: AsyncSession = Depends(get_db)):
    """Get high-level gateway metrics."""
    now = datetime.now(timezone.utc)

    # Site counts
    total_sites = await db.scalar(select(func.count(Site.id)))
    active_sites = await db.scalar(
        select(func.count(Site.id)).where(Site.status == SiteStatus.ACTIVE)
    )

    # TODO: connected sites from Redis
    connected_sites = 0

    # Policy count
    total_policies = await db.scalar(select(func.count(RoutingPolicy.id)))

    # Certificate counts
    active_certs = await db.scalar(
        select(func.count(SiteCertificate.id)).where(SiteCertificate.is_active.is_(True))
    )
    expiring_soon = await db.scalar(
        select(func.count(SiteCertificate.id)).where(
            SiteCertificate.is_active.is_(True),
            SiteCertificate.expires_at < now + timedelta(hours=24),
        )
    )

    # TODO: message counts from Redis/NATS
    messages_routed = 0
    messages_rejected = 0

    return GatewayMetrics(
        total_sites=total_sites or 0,
        active_sites=active_sites or 0,
        connected_sites=connected_sites,
        total_policies=total_policies or 0,
        messages_routed_last_hour=messages_routed,
        messages_rejected_last_hour=messages_rejected,
        active_certificates=active_certs or 0,
        expiring_certificates_24h=expiring_soon or 0,
    )


@router.get("/metrics/throughput", response_model=list[SiteThroughput])
async def get_throughput(
    period: int = Query(3600, description="Period in seconds", ge=60, le=86400),
    db: AsyncSession = Depends(get_db),
):
    """Get message throughput per site."""
    # TODO: implement with Redis counters
    sites_result = await db.execute(
        select(Site).where(Site.status == SiteStatus.ACTIVE)
    )
    sites = sites_result.scalars().all()

    return [
        SiteThroughput(
            site_id=site.id,
            site_slug=site.slug,
            messages_in=0,
            messages_out=0,
            bytes_in=0,
            bytes_out=0,
            period_seconds=period,
        )
        for site in sites
    ]


@router.get("/audit", response_model=PaginatedResponse[AuditLogEntry])
async def get_audit_log(
    site_id: Optional[UUID] = None,
    action: Optional[str] = None,
    actor_id: Optional[str] = None,
    since: Optional[datetime] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Query the audit log."""
    conditions = []
    if site_id:
        conditions.append(AuditLog.site_id == site_id)
    if action:
        conditions.append(AuditLog.action == action)
    if actor_id:
        conditions.append(AuditLog.actor_id == actor_id)
    if since:
        conditions.append(AuditLog.timestamp >= since)

    total = await db.scalar(
        select(func.count()).select_from(AuditLog).where(*conditions)
    )

    result = await db.execute(
        select(AuditLog, Site.slug)
        .join(Site, AuditLog.site_id == Site.id, isouter=True)
        .where(*conditions)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .offset(offset)
    )
    items = []
    for entry, slug in result.all():
        entry.site_slug = slug
        items.append(entry)

    return {
        "items": items,
        "total": total or 0,
        "limit": limit,
        "offset": offset,
    }
