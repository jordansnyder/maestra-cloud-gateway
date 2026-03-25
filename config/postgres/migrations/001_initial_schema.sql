-- Maestra Cloud Gateway — Initial Schema
-- Creates all tables for the control plane.

-- ═══════════════════════════════════════════════════════════════════════
-- Extensions
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════
-- Enum Types
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE site_status AS ENUM ('pending', 'active', 'suspended', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE policy_action AS ENUM ('allow', 'deny', 'sample', 'transform');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE policy_direction AS ENUM ('outbound', 'inbound');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'site_created', 'site_updated', 'site_suspended', 'site_revoked',
        'policy_created', 'policy_updated', 'policy_deleted',
        'cert_issued', 'cert_rotated', 'cert_revoked',
        'user_login', 'settings_changed'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'site_admin', 'operator', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Updated At Trigger Function
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ═══════════════════════════════════════════════════════════════════════
-- Sites
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sites (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    status          site_status NOT NULL DEFAULT 'pending',

    -- Location
    region          VARCHAR(100),
    latitude        VARCHAR(20),
    longitude       VARCHAR(20),
    timezone        VARCHAR(50),

    -- Connection
    nats_account    VARCHAR(255),
    last_connected_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    agent_version   VARCHAR(50),

    -- Metadata
    metadata        JSONB DEFAULT '{}',
    tags            JSONB DEFAULT '[]',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS ix_sites_region ON sites(region);
CREATE INDEX IF NOT EXISTS ix_sites_tags ON sites USING GIN(tags);

DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- Routing Policies
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS routing_policies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    priority        INTEGER NOT NULL DEFAULT 100,

    -- Rule
    direction       policy_direction NOT NULL,
    action          policy_action NOT NULL DEFAULT 'allow',
    subject_pattern VARCHAR(500) NOT NULL,

    -- Destinations / Sources
    destination_site_ids JSONB,
    destination_tags     JSONB,
    source_site_ids      JSONB,

    -- Rate limiting
    rate_limit               INTEGER,
    rate_limit_window_seconds INTEGER DEFAULT 1,

    -- Sampling
    sample_rate     VARCHAR(10),

    -- Transforms
    transforms      JSONB,

    -- Versioning
    version         INTEGER NOT NULL DEFAULT 1,
    metadata        JSONB DEFAULT '{}',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(site_id, name)
);

CREATE INDEX IF NOT EXISTS ix_policies_site_id ON routing_policies(site_id);
CREATE INDEX IF NOT EXISTS ix_policies_direction ON routing_policies(direction);
CREATE INDEX IF NOT EXISTS ix_policies_enabled ON routing_policies(enabled);

DROP TRIGGER IF EXISTS update_policies_updated_at ON routing_policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON routing_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- Site Certificates
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_certificates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id             UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    serial_number       VARCHAR(100) NOT NULL UNIQUE,
    fingerprint_sha256  VARCHAR(95) NOT NULL UNIQUE,
    common_name         VARCHAR(255) NOT NULL,

    issued_at           TIMESTAMPTZ NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    revocation_reason   VARCHAR(255),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_certs_site_id ON site_certificates(site_id);
CREATE INDEX IF NOT EXISTS ix_certs_active ON site_certificates(is_active);
CREATE INDEX IF NOT EXISTS ix_certs_expires ON site_certificates(expires_at);

-- ═══════════════════════════════════════════════════════════════════════
-- Audit Log (append-only)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action          audit_action NOT NULL,
    actor_id        VARCHAR(255),
    actor_email     VARCHAR(255),
    site_id         UUID,

    resource_type   VARCHAR(100) NOT NULL,
    resource_id     VARCHAR(255) NOT NULL,
    details         JSONB,

    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS ix_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS ix_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS ix_audit_site_id ON audit_log(site_id);
CREATE INDEX IF NOT EXISTS ix_audit_actor ON audit_log(actor_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Users
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'viewer',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    oidc_subject    VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255),

    allowed_site_ids JSONB,

    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════
-- Schema Migrations Tracking
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS schema_migrations (
    id          SERIAL PRIMARY KEY,
    filename    VARCHAR(255) NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (filename)
VALUES ('001_initial_schema.sql')
ON CONFLICT (filename) DO NOTHING;
