"""Database models for the Cloud Gateway control plane."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(AsyncAttrs, DeclarativeBase):
    pass


# ─── Enums ───────────────────────────────────────────────────────────────────


class SiteStatus(str, PyEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class PolicyAction(str, PyEnum):
    ALLOW = "allow"
    DENY = "deny"
    SAMPLE = "sample"
    TRANSFORM = "transform"


class PolicyDirection(str, PyEnum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class AuditAction(str, PyEnum):
    SITE_CREATED = "site_created"
    SITE_UPDATED = "site_updated"
    SITE_SUSPENDED = "site_suspended"
    SITE_REVOKED = "site_revoked"
    POLICY_CREATED = "policy_created"
    POLICY_UPDATED = "policy_updated"
    POLICY_DELETED = "policy_deleted"
    CERT_ISSUED = "cert_issued"
    CERT_ROTATED = "cert_rotated"
    CERT_REVOKED = "cert_revoked"
    USER_LOGIN = "user_login"
    SETTINGS_CHANGED = "settings_changed"


class UserRole(str, PyEnum):
    SUPER_ADMIN = "super_admin"
    SITE_ADMIN = "site_admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


# ─── Models ──────────────────────────────────────────────────────────────────


class Site(Base):
    """A registered Maestra installation."""

    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(SiteStatus), nullable=False, default=SiteStatus.PENDING)

    # Location
    region = Column(String(100), nullable=True)
    latitude = Column(String(20), nullable=True)
    longitude = Column(String(20), nullable=True)
    timezone = Column(String(50), nullable=True)

    # Connection
    nats_account = Column(String(255), nullable=True)
    last_connected_at = Column(DateTime(timezone=True), nullable=True)
    last_heartbeat_at = Column(DateTime(timezone=True), nullable=True)
    agent_version = Column(String(50), nullable=True)

    # Metadata
    site_metadata = Column("metadata", JSONB, nullable=True, default=dict)
    tags = Column(JSONB, nullable=True, default=list)

    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    policies = relationship("RoutingPolicy", back_populates="site", cascade="all, delete-orphan")
    certificates = relationship("SiteCertificate", back_populates="site", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_sites_status", "status"),
        Index("ix_sites_region", "region"),
    )


class RoutingPolicy(Base):
    """Routing rules for a site — controls which messages flow where."""

    __tablename__ = "routing_policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    priority = Column(Integer, nullable=False, default=100)

    # Rule definition
    direction = Column(Enum(PolicyDirection), nullable=False)
    action = Column(Enum(PolicyAction), nullable=False, default=PolicyAction.ALLOW)
    subject_pattern = Column(String(500), nullable=False)  # NATS subject pattern with wildcards

    # Destinations (for outbound rules)
    destination_site_ids = Column(JSONB, nullable=True)  # null = all sites, [] = broadcast
    destination_tags = Column(JSONB, nullable=True)  # route by tag instead of explicit IDs

    # Source filtering (for inbound rules)
    source_site_ids = Column(JSONB, nullable=True)

    # Rate limiting
    rate_limit = Column(Integer, nullable=True)  # messages per window
    rate_limit_window_seconds = Column(Integer, nullable=True, default=1)

    # Sampling
    sample_rate = Column(String(10), nullable=True)  # e.g., "0.1" for 10%

    # Transform pipeline
    transforms = Column(JSONB, nullable=True)  # ordered list of transform configs

    # Policy metadata
    version = Column(Integer, nullable=False, default=1)
    policy_metadata = Column("metadata", JSONB, nullable=True, default=dict)

    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    site = relationship("Site", back_populates="policies")

    __table_args__ = (
        Index("ix_policies_site_id", "site_id"),
        Index("ix_policies_direction", "direction"),
        Index("ix_policies_enabled", "enabled"),
        UniqueConstraint("site_id", "name", name="uq_policy_site_name"),
    )


class SiteCertificate(Base):
    """TLS client certificate records for sites."""

    __tablename__ = "site_certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)

    serial_number = Column(String(100), nullable=False, unique=True)
    fingerprint_sha256 = Column(String(95), nullable=False, unique=True)
    common_name = Column(String(255), nullable=False)

    issued_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(String(255), nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    site = relationship("Site", back_populates="certificates")

    __table_args__ = (
        Index("ix_certs_site_id", "site_id"),
        Index("ix_certs_active", "is_active"),
        Index("ix_certs_expires", "expires_at"),
    )


class AuditLog(Base):
    """Immutable audit trail for all administrative actions."""

    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    action = Column(Enum(AuditAction), nullable=False)
    actor_id = Column(String(255), nullable=True)  # user ID or "system"
    actor_email = Column(String(255), nullable=True)
    site_id = Column(UUID(as_uuid=True), nullable=True)

    # What changed
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=False)
    details = Column(JSONB, nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_audit_timestamp", "timestamp"),
        Index("ix_audit_action", "action"),
        Index("ix_audit_site_id", "site_id"),
        Index("ix_audit_actor", "actor_id"),
    )


class User(Base):
    """Gateway dashboard users."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = Column(Boolean, nullable=False, default=True)

    # OIDC subject (external identity)
    oidc_subject = Column(String(255), nullable=True, unique=True)

    # For local auth fallback (dev/testing)
    password_hash = Column(String(255), nullable=True)

    # Site scope (null = all sites for super_admin)
    allowed_site_ids = Column(JSONB, nullable=True)

    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
    )
