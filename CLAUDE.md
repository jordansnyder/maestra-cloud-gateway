# CLAUDE.md — Maestra Cloud Gateway

## Project Overview

Maestra Cloud Gateway is a secure, cloud-hosted service that connects multiple Maestra installations across physical locations. It provides policy-driven selective message routing, mutual TLS authentication, real-time monitoring, and a management dashboard.

## Architecture

```
Sites (outbound TLS) → Edge Proxy (Envoy) → Auth (mTLS/OIDC) → Message Router → Cloud NATS
                                                                       ↓
                                                              Policy Engine
                                                                       ↓
                                                            Control Plane API
                                                                       ↓
                                                            Cloud Dashboard
```

### Key Design Principles
- **Outbound-only connections** — sites never expose ports
- **NATS accounts for multi-tenancy** — cryptographic isolation between sites
- **Policy-driven routing** — every cross-site message flow is explicitly allowed
- **Separate cloud NATS cluster** — independent from local site NATS instances
- **Zero-trust security** — mTLS + OIDC + RBAC + audit logging

## Service Map

| Service | Port | Purpose |
|---------|------|---------|
| Control Plane API | 8090 | FastAPI - site management, policies, certs |
| Message Router | internal | Routes messages between sites per policy |
| Cloud Dashboard | 3002 | Next.js management UI |
| Cloud NATS | 4223, 8223 | Cloud message bus with accounts |
| Edge Proxy (Envoy) | 443, 8443 | TLS termination, mTLS, rate limiting |
| PostgreSQL | 5433 | Control plane state (sites, policies, audit) |
| Redis | 6380 | Policy cache, session state, rate limiting |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3003 | Operational dashboards |
| Loki | 3100 | Log aggregation |

## Common Commands

```bash
make up              # Start all gateway services
make down            # Stop all services
make dev             # Start dev mode (hot reload)
make build           # Rebuild all services
make test            # Run all tests
make test-integration # Integration tests
make test-load       # Load tests with k6
make logs            # View all logs
make logs-service SERVICE=control-plane
make migrate         # Run database migrations
make cert-init       # Initialize CA and generate dev certs
make cert-site SITE=site-name  # Generate site client cert
```

## Development Patterns

### Python Services (Control Plane, Message Router, Agent)
- **Python 3.12+**, async-first with asyncio
- **FastAPI** for HTTP APIs
- **nats-py** for NATS connectivity
- **SQLAlchemy 2.0** async with AsyncPG
- **Pydantic v2** for models with strict validation
- **Global singleton pattern** for NATS/Redis connections

### Message Envelope (Cloud)
```json
{
  "id": "uuid",
  "source_site_id": "site-nyc-01",
  "subject": "maestra.entity.state.light.main",
  "data": { ... },
  "timestamp": "ISO-8601",
  "correlation_id": "uuid",
  "hop_count": 1,
  "policy_id": "uuid"
}
```

### Cloud NATS Subject Namespace
```
cloud.site.<site_id>.>           # Site-scoped messages
cloud.broadcast.>                # All-site broadcasts
cloud.control.<site_id>.>       # Policy updates, commands
cloud.metrics.<site_id>.>       # Forwarded metrics
cloud.heartbeat.<site_id>       # Site health
```

### Database
- PostgreSQL for control plane state
- Redis for ephemeral state (policies cache, rate limits, sessions)
- All migrations in `config/postgres/migrations/` with numbered prefixes

## Environment Variables

See `.env.example` for full reference. Key variables:

```bash
# Cloud NATS
CLOUD_NATS_URL=nats://cloud-nats:4223

# Database
DATABASE_URL=postgresql+asyncpg://gateway:password@postgres:5433/gateway

# Redis
REDIS_URL=redis://redis:6380

# Auth
OIDC_ISSUER_URL=https://your-idp.com
OIDC_CLIENT_ID=maestra-gateway
JWT_SECRET=change-me

# TLS
CA_CERT_PATH=/certs/ca.crt
CA_KEY_PATH=/certs/ca.key
```
