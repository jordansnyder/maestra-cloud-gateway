"""Certificate manager — CA operations, issuance, rotation, revocation.

Uses the `cryptography` library for X.509 certificate operations.
In production, consider integrating with HashiCorp Vault, AWS ACM PCA,
or a dedicated PKI solution.
"""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import structlog
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID

logger = structlog.get_logger()

CA_CERT_PATH = os.getenv("CA_CERT_PATH", "/certs/ca.crt")
CA_KEY_PATH = os.getenv("CA_KEY_PATH", "/certs/ca.key")
SITE_CERT_VALIDITY_HOURS = int(os.getenv("SITE_CERT_VALIDITY_HOURS", "24"))

# Module-level CA state
_ca_cert: Optional[x509.Certificate] = None
_ca_key = None


def init():
    """Load the CA certificate and key from disk."""
    global _ca_cert, _ca_key

    ca_cert_path = Path(CA_CERT_PATH)
    ca_key_path = Path(CA_KEY_PATH)

    if not ca_cert_path.exists() or not ca_key_path.exists():
        logger.warning(
            "cert_manager.ca_not_found",
            cert_path=CA_CERT_PATH,
            key_path=CA_KEY_PATH,
            msg="Run 'make cert-init' to generate CA certificates",
        )
        return

    with open(ca_cert_path, "rb") as f:
        _ca_cert = x509.load_pem_x509_certificate(f.read())

    with open(ca_key_path, "rb") as f:
        _ca_key = serialization.load_pem_private_key(f.read(), password=None)

    logger.info(
        "cert_manager.initialized",
        ca_subject=_ca_cert.subject.rfc4514_string(),
        ca_expires=_ca_cert.not_valid_after_utc.isoformat(),
    )


def is_initialized() -> bool:
    return _ca_cert is not None and _ca_key is not None


def get_ca_cert_pem() -> str:
    """Return the CA certificate in PEM format."""
    if not _ca_cert:
        raise RuntimeError("CA not initialized")
    return _ca_cert.public_bytes(serialization.Encoding.PEM).decode()


def issue_site_certificate(
    site_slug: str,
    site_id: str,
    validity_hours: Optional[int] = None,
) -> tuple[str, str, str, str, str]:
    """Issue a client certificate for a site.

    Returns: (cert_pem, key_pem, serial_number, fingerprint_sha256, common_name)
    """
    if not is_initialized():
        raise RuntimeError("CA not initialized — run 'make cert-init'")

    validity = validity_hours or SITE_CERT_VALIDITY_HOURS
    common_name = f"maestra-site-{site_slug}"

    # Generate ECDSA P-256 key pair
    site_key = ec.generate_private_key(ec.SECP256R1())

    # Build CSR-like subject
    subject = x509.Name([
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Maestra Cloud Gateway"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Sites"),
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.SERIAL_NUMBER, site_id),
    ])

    now = datetime.now(timezone.utc)

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(_ca_cert.subject)
        .public_key(site_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(hours=validity))
        # Key usage: digital signature + client auth
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH]),
            critical=True,
        )
        # Subject Alternative Name with site ID for NATS account mapping
        .add_extension(
            x509.SubjectAlternativeName([
                x509.UniformResourceIdentifier(f"maestra:site:{site_id}"),
                x509.DNSName(common_name),
            ]),
            critical=False,
        )
        .add_extension(
            x509.AuthorityKeyIdentifier.from_issuer_public_key(_ca_key.public_key()),
            critical=False,
        )
        .sign(_ca_key, hashes.SHA256())
    )

    cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode()
    key_pem = site_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()

    serial = format(cert.serial_number, "x")
    fingerprint = cert.fingerprint(hashes.SHA256()).hex(":")

    logger.info(
        "cert_manager.cert_issued",
        site_slug=site_slug,
        common_name=common_name,
        serial=serial,
        expires=cert.not_valid_after_utc.isoformat(),
    )

    return cert_pem, key_pem, serial, fingerprint, common_name


def generate_ca(
    output_dir: str = "/certs",
    validity_days: int = 3650,
) -> tuple[str, str]:
    """Generate a new CA certificate and key. Used by cert-init script."""
    ca_key = ec.generate_private_key(ec.SECP256R1())

    subject = x509.Name([
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Maestra"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Cloud Gateway CA"),
        x509.NameAttribute(NameOID.COMMON_NAME, "Maestra Cloud Gateway Root CA"),
    ])

    now = datetime.now(timezone.utc)

    ca_cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(ca_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now)
        .not_valid_after(now + timedelta(days=validity_days))
        .add_extension(
            x509.BasicConstraints(ca=True, path_length=0),
            critical=True,
        )
        .add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=False,
                content_commitment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=True,
                crl_sign=True,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )
        .sign(ca_key, hashes.SHA256())
    )

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    cert_path = out / "ca.crt"
    key_path = out / "ca.key"

    cert_path.write_bytes(ca_cert.public_bytes(serialization.Encoding.PEM))
    key_path.write_bytes(
        ca_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    # Restrict key permissions
    key_path.chmod(0o600)

    logger.info(
        "cert_manager.ca_generated",
        cert_path=str(cert_path),
        expires=(now + timedelta(days=validity_days)).isoformat(),
    )

    return str(cert_path), str(key_path)
