#!/usr/bin/env bash
# Generate development CA and server certificates for the Maestra Cloud Gateway.
# These are for LOCAL DEV ONLY — never use in production.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/../../certs"

mkdir -p "$CERTS_DIR"

echo "=== Maestra Cloud Gateway — Dev Certificate Generation ==="

# Check if CA already exists
if [ -f "$CERTS_DIR/ca.crt" ] && [ -f "$CERTS_DIR/ca.key" ]; then
    echo "CA already exists at $CERTS_DIR/ca.crt"
    echo "Delete it first if you want to regenerate."
    exit 0
fi

# Generate CA key (ECDSA P-256)
echo "Generating CA private key..."
openssl ecparam -genkey -name prime256v1 -noout -out "$CERTS_DIR/ca.key"
chmod 600 "$CERTS_DIR/ca.key"

# Generate CA certificate (10 years)
echo "Generating CA certificate..."
openssl req -new -x509 \
    -key "$CERTS_DIR/ca.key" \
    -out "$CERTS_DIR/ca.crt" \
    -days 3650 \
    -subj "/O=Maestra/OU=Cloud Gateway CA/CN=Maestra Cloud Gateway Root CA" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
    -addext "keyUsage=critical,keyCertSign,cRLSign,digitalSignature"

# Generate server key and cert (for the gateway itself)
echo "Generating server private key..."
openssl ecparam -genkey -name prime256v1 -noout -out "$CERTS_DIR/server.key"
chmod 600 "$CERTS_DIR/server.key"

echo "Generating server CSR..."
openssl req -new \
    -key "$CERTS_DIR/server.key" \
    -out "$CERTS_DIR/server.csr" \
    -subj "/O=Maestra/OU=Cloud Gateway/CN=gateway.maestra.local"

echo "Signing server certificate..."
openssl x509 -req \
    -in "$CERTS_DIR/server.csr" \
    -CA "$CERTS_DIR/ca.crt" \
    -CAkey "$CERTS_DIR/ca.key" \
    -CAcreateserial \
    -out "$CERTS_DIR/server.crt" \
    -days 365 \
    -extfile <(cat <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:gateway.maestra.local,DNS:localhost,IP:127.0.0.1
EOF
)

# Clean up CSR
rm -f "$CERTS_DIR/server.csr" "$CERTS_DIR/ca.srl"

echo ""
echo "=== Certificates generated ==="
echo "  CA cert:     $CERTS_DIR/ca.crt"
echo "  CA key:      $CERTS_DIR/ca.key"
echo "  Server cert: $CERTS_DIR/server.crt"
echo "  Server key:  $CERTS_DIR/server.key"
echo ""
echo "To generate a site client cert:"
echo "  make cert-site SITE=my-site-name"
