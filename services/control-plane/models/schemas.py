"""Pydantic schemas for API request/response validation."""

from datetime import datetime, timezone
from enum import Enum
from typing import Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Envelope for paginated list endpoints."""

    items: list[T]
    total: int
    limit: int
    offset: int


# ─── Enums ───────────────────────────────────────────────────────────────────


class SiteStatusEnum(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class PolicyDirectionEnum(str, Enum):
    OUTBOUND = "outbound"
    INBOUND = "inbound"


class PolicyActionEnum(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    SAMPLE = "sample"
    TRANSFORM = "transform"


class UserRoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    SITE_ADMIN = "site_admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


# ─── Sites ───────────────────────────────────────────────────────────────────


class SiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-z0-9][a-z0-9-]*[a-z0-9]$")
    description: Optional[str] = None
    region: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    timezone: Optional[str] = None
    metadata: Optional[dict] = None
    tags: Optional[list[str]] = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    region: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    timezone: Optional[str] = None
    metadata: Optional[dict] = None
    tags: Optional[list[str]] = None


class SiteResponse(SiteBase):
    model_config = ConfigDict(
        from_attributes=True, use_enum_values=True, populate_by_name=True
    )

    id: UUID
    status: SiteStatusEnum
    # ORM attribute is `site_metadata`; `.metadata` on a SQLAlchemy model is the
    # MetaData registry, not the JSON column.
    metadata: Optional[dict] = Field(default=None, validation_alias="site_metadata")
    nats_account: Optional[str] = None
    last_connected_at: Optional[datetime] = None
    last_heartbeat_at: Optional[datetime] = None
    agent_version: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SiteStatusResponse(BaseModel):
    site_id: UUID
    slug: str
    status: SiteStatusEnum
    is_connected: bool
    last_heartbeat_at: Optional[datetime] = None
    uptime_seconds: Optional[float] = None
    messages_in_last_hour: int = 0
    messages_out_last_hour: int = 0
    agent_version: Optional[str] = None


# ─── Routing Policies ────────────────────────────────────────────────────────


class TransformConfig(BaseModel):
    type: str  # "strip_pii", "rename_subject", "filter_fields", etc.
    config: Optional[dict] = None


class PolicyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    enabled: bool = True
    priority: int = Field(100, ge=0, le=10000)
    direction: PolicyDirectionEnum
    action: PolicyActionEnum = PolicyActionEnum.ALLOW
    subject_pattern: str = Field(..., min_length=1, max_length=500)
    destination_site_ids: Optional[list[UUID]] = None
    destination_tags: Optional[list[str]] = None
    source_site_ids: Optional[list[UUID]] = None
    rate_limit: Optional[int] = Field(None, ge=1)
    rate_limit_window_seconds: Optional[int] = Field(None, ge=1, le=3600)
    sample_rate: Optional[str] = Field(None, pattern=r"^[01](\.\d+)?$")
    transforms: Optional[list[TransformConfig]] = None
    metadata: Optional[dict] = None


class PolicyCreate(PolicyBase):
    pass


class PolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    enabled: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=10000)
    action: Optional[PolicyActionEnum] = None
    subject_pattern: Optional[str] = Field(None, min_length=1, max_length=500)
    destination_site_ids: Optional[list[UUID]] = None
    destination_tags: Optional[list[str]] = None
    source_site_ids: Optional[list[UUID]] = None
    rate_limit: Optional[int] = Field(None, ge=1)
    rate_limit_window_seconds: Optional[int] = Field(None, ge=1, le=3600)
    sample_rate: Optional[str] = Field(None, pattern=r"^[01](\.\d+)?$")
    transforms: Optional[list[TransformConfig]] = None
    metadata: Optional[dict] = None


class PolicyResponse(PolicyBase):
    model_config = ConfigDict(
        from_attributes=True, use_enum_values=True, populate_by_name=True
    )

    id: UUID
    site_id: UUID
    version: int
    # ORM attribute is `policy_metadata` (see SiteResponse note re: `.metadata`).
    metadata: Optional[dict] = Field(default=None, validation_alias="policy_metadata")
    created_at: datetime
    updated_at: datetime


class PolicyTestRequest(BaseModel):
    """Dry-run a message against policies."""

    subject: str
    source_site_id: UUID
    data: Optional[dict] = None


class PolicyTestResult(BaseModel):
    matched: bool
    policy_id: Optional[UUID] = None
    policy_name: Optional[str] = None
    action: Optional[PolicyActionEnum] = None
    destinations: list[UUID] = []
    would_transform: bool = False
    would_sample: bool = False
    rate_limited: bool = False


# ─── Certificates ────────────────────────────────────────────────────────────


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    site_id: UUID
    site_slug: Optional[str] = None
    serial_number: str
    fingerprint_sha256: str
    common_name: str
    issued_at: datetime
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool

    # Friendly aliases / derived status the dashboard renders.
    @computed_field
    @property
    def serial(self) -> str:
        return self.serial_number

    @computed_field
    @property
    def fingerprint(self) -> str:
        return self.fingerprint_sha256

    @computed_field
    @property
    def status(self) -> str:
        if self.revoked_at is not None:
            return "revoked"
        if self.expires_at <= datetime.now(timezone.utc):
            return "expired"
        return "valid"


class CertificateIssueRequest(BaseModel):
    validity_hours: Optional[int] = Field(24, ge=1, le=8760)


class CertificateIssueResponse(BaseModel):
    certificate: CertificateResponse
    client_cert_pem: str
    client_key_pem: str
    ca_cert_pem: str


class CertificateRevokeRequest(BaseModel):
    reason: Optional[str] = None


# ─── Audit Log ───────────────────────────────────────────────────────────────


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    timestamp: datetime
    action: str
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    site_id: Optional[UUID] = None
    site_slug: Optional[str] = None
    resource_type: str
    resource_id: str
    details: Optional[dict] = None

    @computed_field
    @property
    def actor(self) -> str:
        return self.actor_email or self.actor_id or "system"


# ─── Metrics ─────────────────────────────────────────────────────────────────


class GatewayMetrics(BaseModel):
    total_sites: int
    active_sites: int
    connected_sites: int
    total_policies: int
    messages_routed_last_hour: int
    messages_rejected_last_hour: int
    active_certificates: int
    expiring_certificates_24h: int


class SiteThroughput(BaseModel):
    site_id: UUID
    site_slug: str
    messages_in: int
    messages_out: int
    bytes_in: int
    bytes_out: int
    period_seconds: int


# ─── Auth ────────────────────────────────────────────────────────────────────


class TokenRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: UUID
    email: str
    name: Optional[str] = None
    role: UserRoleEnum
    is_active: bool
    allowed_site_ids: Optional[list[UUID]] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime


# ─── Cloud Messages ─────────────────────────────────────────────────────────


class CloudMessage(BaseModel):
    """Message envelope for cross-site routing."""

    id: UUID
    source_site_id: str
    subject: str
    data: dict
    timestamp: datetime
    correlation_id: UUID
    hop_count: int = 1
    policy_id: Optional[UUID] = None
