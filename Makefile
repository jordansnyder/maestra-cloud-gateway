.PHONY: help up down dev build test logs migrate cert-init cert-site clean

COMPOSE = docker compose
SERVICE ?=

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Lifecycle ───────────────────────────────────────────────────────────────

up: ## Start all gateway services
	$(COMPOSE) up -d

down: ## Stop all services
	$(COMPOSE) down

dev: ## Start in dev mode with hot reload
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up

build: ## Rebuild all custom services
	$(COMPOSE) build

restart: ## Restart all services
	$(COMPOSE) restart

clean: ## Stop and remove containers (keeps volumes)
	$(COMPOSE) down --remove-orphans

clean-all: ## Remove everything including data (DESTRUCTIVE)
	$(COMPOSE) down -v --remove-orphans

# ─── Init ────────────────────────────────────────────────────────────────────

init: ## Initialize .env from .env.example
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example"; else echo ".env already exists"; fi

# ─── Logs ────────────────────────────────────────────────────────────────────

logs: ## View all logs
	$(COMPOSE) logs -f

logs-service: ## View logs for specific service (SERVICE=control-plane)
	$(COMPOSE) logs -f $(SERVICE)

ps: ## Show service status
	$(COMPOSE) ps

# ─── Database ────────────────────────────────────────────────────────────────

migrate: ## Run pending database migrations
	$(COMPOSE) exec control-plane python -m alembic upgrade head

migrate-create: ## Create a new migration (MSG="description")
	$(COMPOSE) exec control-plane python -m alembic revision --autogenerate -m "$(MSG)"

shell-postgres: ## Open psql shell
	$(COMPOSE) exec gateway-postgres psql -U gateway -d gateway

shell-redis: ## Open Redis CLI
	$(COMPOSE) exec gateway-redis redis-cli -p 6380

# ─── Certificates ────────────────────────────────────────────────────────────

cert-init: ## Initialize CA and generate dev certificates
	bash config/certs/generate-dev-certs.sh

cert-site: ## Generate client cert for a site (SITE=site-name)
	@if [ -z "$(SITE)" ]; then echo "Usage: make cert-site SITE=site-name"; exit 1; fi
	bash config/certs/generate-site-cert.sh $(SITE)

# ─── Testing ─────────────────────────────────────────────────────────────────

test: ## Run all tests
	cd services/control-plane && python -m pytest tests/ -v
	cd services/message-router && python -m pytest tests/ -v
	cd agent && python -m pytest tests/ -v

test-integration: ## Run integration tests (requires running services)
	cd tests/integration && python -m pytest -v

test-load: ## Run load tests with k6
	k6 run tests/load/gateway-load.js

# ─── Health ──────────────────────────────────────────────────────────────────

dev-website: ## Start marketing website in dev mode
	cd services/website && npm run dev

health: ## Check all service health
	@echo "Control Plane:"; curl -sf http://localhost:8090/health | python -m json.tool || echo "  DOWN"
	@echo "Cloud NATS:"; curl -sf http://localhost:8223/healthz || echo "  DOWN"
	@echo "Redis:"; $(COMPOSE) exec gateway-redis redis-cli -p 6380 ping || echo "  DOWN"
	@echo "PostgreSQL:"; $(COMPOSE) exec gateway-postgres pg_isready -p 5433 || echo "  DOWN"
