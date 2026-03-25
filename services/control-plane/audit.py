"""Audit logging — immutable record of all administrative actions."""

from typing import Optional
from uuid import UUID

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import AuditAction, AuditLog

logger = structlog.get_logger()


async def log(
    db: AsyncSession,
    action: AuditAction,
    resource_type: str,
    resource_id: str,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    site_id: Optional[UUID] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    """Record an audit log entry."""
    entry = AuditLog(
        action=action,
        actor_id=actor_id or "system",
        actor_email=actor_email,
        site_id=site_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(entry)
    await db.flush()

    logger.info(
        "audit.logged",
        action=action.value,
        resource_type=resource_type,
        resource_id=resource_id,
        actor=actor_id or "system",
    )
