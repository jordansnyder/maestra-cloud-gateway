"""Maestra Cloud Gateway — Control Plane API.

Central management service for sites, routing policies, certificates, and metrics.
"""

import os
from contextlib import asynccontextmanager

import nats
import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import cert_manager
import policy_engine
from routes import certificates, metrics, policies, sites

logger = structlog.get_logger()

NATS_URL = os.getenv("CLOUD_NATS_URL", "nats://cloud-nats:4223")

# Module-level NATS client
nc = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    global nc

    # Connect to cloud NATS
    try:
        nc = await nats.connect(NATS_URL)
        logger.info("nats.connected", url=NATS_URL)
    except Exception as e:
        logger.warning("nats.connect_failed", error=str(e), msg="Running without NATS")
        nc = None

    # Initialize policy engine
    await policy_engine.init(nats_client=nc)

    # Initialize certificate manager
    cert_manager.init()

    logger.info("control_plane.started")
    yield

    # Shutdown
    await policy_engine.close()
    if nc:
        await nc.close()
    logger.info("control_plane.stopped")


app = FastAPI(
    title="Maestra Cloud Gateway",
    description="Control plane for managing multi-site Maestra deployments",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(sites.router, prefix="/api/v1")
app.include_router(policies.router, prefix="/api/v1")
app.include_router(certificates.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "control-plane",
        "nats_connected": nc is not None and nc.is_connected if nc else False,
        "ca_initialized": cert_manager.is_initialized(),
    }


@app.get("/api/v1")
async def api_root():
    """API version info."""
    return {
        "name": "Maestra Cloud Gateway",
        "version": "0.1.0",
        "endpoints": {
            "sites": "/api/v1/sites",
            "policies": "/api/v1/policies",
            "certificates": "/api/v1/certificates",
            "metrics": "/api/v1/metrics",
            "audit": "/api/v1/audit",
        },
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("CONTROL_PLANE_HOST", "0.0.0.0"),
        port=int(os.getenv("CONTROL_PLANE_PORT", "8090")),
        reload=os.getenv("NODE_ENV", "development") == "development",
        log_level=os.getenv("CONTROL_PLANE_LOG_LEVEL", "info"),
    )
