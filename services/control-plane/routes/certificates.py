"""Certificate management endpoints."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

import audit
import cert_manager
from database import get_db
from models.database import AuditAction, Site, SiteCertificate, SiteStatus
from models.schemas import (
    CertificateIssueRequest,
    CertificateIssueResponse,
    CertificateResponse,
    CertificateRevokeRequest,
    PaginatedResponse,
)

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("", response_model=PaginatedResponse[CertificateResponse])
async def list_certificates(
    site_id: Optional[UUID] = None,
    active_only: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List certificates across all sites with optional filtering."""
    conditions = []
    if site_id:
        conditions.append(SiteCertificate.site_id == site_id)
    if active_only:
        conditions.append(SiteCertificate.is_active.is_(True))

    total = await db.scalar(
        select(func.count()).select_from(SiteCertificate).where(*conditions)
    )

    query = (
        select(SiteCertificate)
        .where(*conditions)
        .order_by(SiteCertificate.issued_at.desc())
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


@router.get("/site/{site_id}", response_model=list[CertificateResponse])
async def list_site_certificates(
    site_id: UUID,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """List certificates for a site."""
    query = select(SiteCertificate).where(SiteCertificate.site_id == site_id)
    if active_only:
        query = query.where(SiteCertificate.is_active.is_(True))
    query = query.order_by(SiteCertificate.issued_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/site/{site_id}/issue", response_model=CertificateIssueResponse)
async def issue_certificate(
    site_id: UUID,
    request: CertificateIssueRequest = CertificateIssueRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Issue a new client certificate for a site."""
    if not cert_manager.is_initialized():
        raise HTTPException(
            status_code=503,
            detail="Certificate authority not initialized. Run 'make cert-init'.",
        )

    # Verify site exists and is active
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if site.status == SiteStatus.REVOKED:
        raise HTTPException(status_code=403, detail="Cannot issue cert for revoked site")

    # Issue the certificate
    cert_pem, key_pem, serial, fingerprint, cn = cert_manager.issue_site_certificate(
        site_slug=site.slug,
        site_id=str(site.id),
        validity_hours=request.validity_hours,
    )

    # Deactivate previous certs
    prev_certs = await db.execute(
        select(SiteCertificate).where(
            SiteCertificate.site_id == site_id,
            SiteCertificate.is_active.is_(True),
        )
    )
    for prev in prev_certs.scalars().all():
        prev.is_active = False

    # Record the new cert
    now = datetime.now(timezone.utc)
    from datetime import timedelta

    db_cert = SiteCertificate(
        site_id=site_id,
        serial_number=serial,
        fingerprint_sha256=fingerprint,
        common_name=cn,
        issued_at=now,
        expires_at=now + timedelta(hours=request.validity_hours or 24),
        is_active=True,
    )
    db.add(db_cert)
    await db.commit()
    await db.refresh(db_cert)

    await audit.log(
        db,
        AuditAction.CERT_ISSUED,
        resource_type="certificate",
        resource_id=str(db_cert.id),
        site_id=site_id,
        details={
            "serial": serial,
            "common_name": cn,
            "validity_hours": request.validity_hours or 24,
        },
    )
    await db.commit()

    return CertificateIssueResponse(
        certificate=db_cert,
        client_cert_pem=cert_pem,
        client_key_pem=key_pem,
        ca_cert_pem=cert_manager.get_ca_cert_pem(),
    )


@router.post("/{cert_id}/revoke", response_model=CertificateResponse)
async def revoke_certificate(
    cert_id: UUID,
    request: CertificateRevokeRequest = CertificateRevokeRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a certificate."""
    result = await db.execute(
        select(SiteCertificate).where(SiteCertificate.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if not cert.is_active:
        raise HTTPException(status_code=400, detail="Certificate already inactive")

    cert.is_active = False
    cert.revoked_at = datetime.now(timezone.utc)
    cert.revocation_reason = request.reason
    await db.commit()
    await db.refresh(cert)

    await audit.log(
        db,
        AuditAction.CERT_REVOKED,
        resource_type="certificate",
        resource_id=str(cert_id),
        site_id=cert.site_id,
        details={"serial": cert.serial_number, "reason": request.reason},
    )
    await db.commit()

    return cert


@router.post("/{cert_id}/rotate", response_model=CertificateIssueResponse)
async def rotate_certificate(
    cert_id: UUID,
    request: CertificateIssueRequest = CertificateIssueRequest(),
    db: AsyncSession = Depends(get_db),
):
    """Rotate a certificate — revoke old, issue new."""
    result = await db.execute(
        select(SiteCertificate).where(SiteCertificate.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Revoke the old cert
    cert.is_active = False
    cert.revoked_at = datetime.now(timezone.utc)
    cert.revocation_reason = "rotated"
    await db.commit()

    # Issue new cert (reuse the site endpoint logic)
    return await issue_certificate(cert.site_id, request, db)
