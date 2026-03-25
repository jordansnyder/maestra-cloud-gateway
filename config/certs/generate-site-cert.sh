#!/usr/bin/env bash
# Generate a client certificate for a Maestra site.
# Usage: ./generate-site-cert.sh <site-slug>

set -euo pipefail

SITE_SLUG="${1:-}"
if [ -z "$SITE_SLUG" ]; then
    echo "Usage: $0 <site-slug>"
    echo "Example: $0 site-nyc-01"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/../../certs"
SITE_DIR="$CERTS_DIR/sites/$SITE_SLUG"

# Check CA exists
if [ ! -f "$CERTS_DIR/ca.crt" ] || [ ! -f "$CERTS_DIR/ca.key" ]; then
    echo "Error: CA not found. Run 'make cert-init' first."
    exit 1
fi

mkdir -p "$SITE_DIR"

# Check if cert already exists
if [ -f "$SITE_DIR/client.crt" ]; then
    echo "Certificate already exists for site '$SITE_SLUG' at $SITE_DIR/"
    echo "Delete it first if you want to regenerate."
    exit 0
fi

CN="maestra-site-${SITE_SLUG}"

echo "=== Generating client cert for site: $SITE_SLUG ==="

# Generate client key
openssl ecparam -genkey -name prime256v1 -noout -out "$SITE_DIR/client.key"
chmod 600 "$SITE_DIR/client.key"

# Generate CSR
openssl req -new \
    -key "$SITE_DIR/client.key" \
    -out "$SITE_DIR/client.csr" \
    -subj "/O=Maestra Cloud Gateway/OU=Sites/CN=$CN"

# Sign with CA
openssl x509 -req \
    -in "$SITE_DIR/client.csr" \
    -CA "$CERTS_DIR/ca.crt" \
    -CAkey "$CERTS_DIR/ca.key" \
    -CAcreateserial \
    -out "$SITE_DIR/client.crt" \
    -days 1 \
    -extfile <(cat <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=clientAuth
subjectAltName=URI:maestra:site:$SITE_SLUG,DNS:$CN
EOF
)

# Copy CA cert for the site
cp "$CERTS_DIR/ca.crt" "$SITE_DIR/ca.crt"

# Clean up
rm -f "$SITE_DIR/client.csr" "$CERTS_DIR/ca.srl"

echo ""
echo "=== Site certificate generated ==="
echo "  Client cert: $SITE_DIR/client.crt"
echo "  Client key:  $SITE_DIR/client.key"
echo "  CA cert:     $SITE_DIR/ca.crt"
echo ""
echo "Copy these to the site's Maestra installation and configure the Cloud Agent:"
echo "  CLIENT_CERT_PATH=/certs/client.crt"
echo "  CLIENT_KEY_PATH=/certs/client.key"
echo "  CA_CERT_PATH=/certs/ca.crt"
