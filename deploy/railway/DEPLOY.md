# Deploying Maestra Cloud Gateway to Railway

First-deploy scope: **7 services**. Everything from `docker-compose.yml` that is *not*
listed here (Envoy edge-proxy, mTLS, Prometheus, Grafana, Loki) is intentionally
deferred — get the core up first, then layer the rest in.

| Railway service | Source | Public domain? | Notes |
|-----------------|--------|----------------|-------|
| `Postgres`      | Railway managed plugin | no | Replaces the `gateway-postgres` container |
| `Redis`         | Railway managed plugin | no | Replaces the `gateway-redis` container |
| `cloud-nats`    | `services/nats` (Dockerfile) | no | Custom image, config baked in, volume at `/data` |
| `control-plane` | `services/control-plane` | **yes** | FastAPI API |
| `message-router`| `services/message-router` | no | Background worker; needs NATS up |
| `dashboard`     | `services/dashboard` | **yes** | Next.js, talks to control-plane from the browser |
| `website`       | `services/website` | **yes** | Marketing site |

> Railway does **not** run `docker-compose`. Each service below is created
> individually in one Railway project (environment: `production`). The `railway.json`
> files in each service directory carry the build + deploy settings.

---

## 0. Prerequisites

```bash
npm i -g @railway/cli
railway login
cd /Users/jordansnyder/Dev/maestra-cloud-gateway
railway init           # create a new project, or `railway link` to an existing one
```

Each code service uses a **Root Directory** so Railway builds only that subtree and
finds the right `Dockerfile` + `railway.json`. Set it in the service's Settings →
Source, or with the CLI when you create the service.

---

## 1. Managed data stores

In the Railway dashboard → **New → Database**:

- Add **PostgreSQL** → service name `Postgres`
- Add **Redis** → service name `Redis`

These come with their own volumes, backups, and reference variables (used below).
No further config needed yet — but the schema is applied in **step 5**.

---

## 2. NATS (`cloud-nats`)

- New → **GitHub Repo** (this repo) → service name **`cloud-nats`**
- Root Directory: `services/nats`
- Add a **Volume** mounted at `/data` (JetStream persistence)
- Do **not** generate a public domain — it stays on the private network
- No variables required

The service's private hostname becomes `cloud-nats.railway.internal`.

---

## 3. control-plane

- New → GitHub Repo → service name **`control-plane`**
- Root Directory: `services/control-plane`
- Generate a public domain (Settings → Networking → Generate Domain). Note the URL,
  e.g. `https://control-plane-production.up.railway.app`
- Variables:

```bash
# Database — note the postgresql+asyncpg scheme the app requires, over the private net
DATABASE_URL=postgresql+asyncpg://${{Postgres.PGUSER}}:${{Postgres.PGPASSWORD}}@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.PGDATABASE}}

# Redis — the private URL already carries auth + the right port
REDIS_URL=${{Redis.REDIS_PRIVATE_URL}}

# NATS — private hostname of the cloud-nats service
CLOUD_NATS_URL=nats://cloud-nats.railway.internal:4223

# Secrets — DO NOT leave the compose defaults
JWT_SECRET=<generate: openssl rand -hex 32>
CORS_ORIGINS=https://<dashboard-domain>     # set after step 4; comma-separated, NOT *
```

Notes:
- The start command (`uvicorn ... --host :: --port $PORT`) is set in `railway.json`,
  so the app binds Railway's injected `$PORT` instead of the hardcoded 8090.
- Certs are not mounted — `cert_manager` logs a warning and the app runs fine.
  Certificate issuance endpoints stay disabled until the mTLS phase.

---

## 4. dashboard

The dashboard calls the control-plane **from the browser**, so its API URL must be
the control-plane's **public** domain and is baked in **at build time**
(`NEXT_PUBLIC_*`). Railway passes service variables as Docker build args, and the
Dockerfile already declares `ARG NEXT_PUBLIC_API_URL`.

- New → GitHub Repo → service name **`dashboard`**
- Root Directory: `services/dashboard`
- Generate a public domain
- Variables:

```bash
NEXT_PUBLIC_API_URL=https://<control-plane-domain>     # from step 3, https, no trailing slash
```

Then go back and set `CORS_ORIGINS` on **control-plane** to this dashboard domain and
redeploy control-plane.

> If you ever change the control-plane domain, you must **rebuild** the dashboard —
> the value is compiled into the JS bundle, not read at runtime.

---

## 5. Apply the database schema (one-time)

`make migrate` is **broken** (it calls alembic, which isn't configured). The real
schema lives in `config/postgres/migrations/001_initial_schema.sql` and in compose was
auto-applied by the Postgres container — Railway's managed Postgres will **not** run
it. Apply it once by hand against the **public** connection string (Railway dashboard →
Postgres → Connect → "Postgres Connection URL"):

```bash
psql "<public DATABASE_URL from Railway>" -f config/postgres/migrations/001_initial_schema.sql
```

(or `railway connect Postgres` to open psql, then `\i config/postgres/migrations/001_initial_schema.sql`)

Re-run whenever you add a new numbered migration file, in order.

---

## 6. message-router

- New → GitHub Repo → service name **`message-router`**
- Root Directory: `services/message-router`
- No public domain
- Variables:

```bash
CLOUD_NATS_URL=nats://cloud-nats.railway.internal:4223
REDIS_URL=${{Redis.REDIS_PRIVATE_URL}}
```

> The router connects to NATS with no retry — make sure `cloud-nats` is deployed and
> healthy first, or it will restart-loop. With no sites connected yet it will idle
> (nothing to route until the Envoy/mTLS site path is added).

---

## 7. website

- New → GitHub Repo → service name **`website`**
- Root Directory: `services/website`
- Generate a public domain
- No variables required

---

## Deploy order

1. `Postgres`, `Redis`, `cloud-nats`
2. `control-plane` (generate domain)
3. Apply schema (step 5)
4. `dashboard` (set `NEXT_PUBLIC_API_URL`), then set control-plane `CORS_ORIGINS` + redeploy
5. `message-router`
6. `website`

## Post-deploy checks

```bash
curl https://<control-plane-domain>/health        # {"status":"healthy", ...}
curl https://<control-plane-domain>/api/v1        # API version info
```

- Open the dashboard domain — Network tab requests should hit the control-plane domain
  (not localhost) with no CORS errors.
- Open the website domain.
- `cloud-nats` and `message-router` logs should show a successful NATS connect.

## Variable reference (quick map)

| Service | Variable | Value |
|---------|----------|-------|
| control-plane | `DATABASE_URL` | `postgresql+asyncpg://…@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/…` |
| control-plane | `REDIS_URL` | `${{Redis.REDIS_PRIVATE_URL}}` |
| control-plane | `CLOUD_NATS_URL` | `nats://cloud-nats.railway.internal:4223` |
| control-plane | `JWT_SECRET` | `openssl rand -hex 32` |
| control-plane | `CORS_ORIGINS` | dashboard public URL |
| dashboard | `NEXT_PUBLIC_API_URL` | control-plane public URL (build-time) |
| message-router | `CLOUD_NATS_URL` | `nats://cloud-nats.railway.internal:4223` |
| message-router | `REDIS_URL` | `${{Redis.REDIS_PRIVATE_URL}}` |

## Deferred to a later phase
- Envoy edge-proxy + mTLS site connections (conflicts with Railway edge TLS — needs
  the TCP-proxy + in-Envoy mTLS approach)
- NATS per-site account isolation + JWT/nkey auth
- Prometheus / Grafana / Loki (use Railway metrics/logs or Grafana Cloud for now)
