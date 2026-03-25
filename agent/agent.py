"""Maestra Cloud Agent — Site-side sidecar.

Runs inside a local Maestra Docker stack. Connects outbound to the Cloud Gateway
and selectively forwards messages based on policies pulled from the control plane.

Key behaviors:
  - Outbound-only TLS connection (no inbound ports needed)
  - Subscribes to local NATS subjects per routing policy
  - Forwards matching messages to the cloud gateway
  - Receives inbound messages from cloud and publishes to local NATS
  - Sends heartbeats every 10 seconds
  - Auto-reconnects with exponential backoff
  - Pulls policy updates from cloud control subject
"""

import asyncio
import json
import os
import ssl
import time
import uuid
from typing import Optional

import httpx
import nats
import structlog
from nats.aio.msg import Msg

logger = structlog.get_logger()

# ─── Configuration ───────────────────────────────────────────────────────────

SITE_ID = os.getenv("SITE_ID", "")
SITE_SLUG = os.getenv("SITE_SLUG", "")

# Cloud gateway
GATEWAY_API_URL = os.getenv("GATEWAY_API_URL", "http://localhost:8090")
CLOUD_NATS_URL = os.getenv("CLOUD_NATS_URL", "nats://localhost:4223")

# Local Maestra
LOCAL_NATS_URL = os.getenv("LOCAL_NATS_URL", "nats://nats:4222")

# TLS
CLIENT_CERT_PATH = os.getenv("CLIENT_CERT_PATH", "")
CLIENT_KEY_PATH = os.getenv("CLIENT_KEY_PATH", "")
CA_CERT_PATH = os.getenv("CA_CERT_PATH", "")

# Agent
HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "10"))
RECONNECT_BASE_DELAY = float(os.getenv("RECONNECT_BASE_DELAY", "1.0"))
RECONNECT_MAX_DELAY = float(os.getenv("RECONNECT_MAX_DELAY", "60.0"))
AGENT_VERSION = "0.1.0"

# ─── State ───────────────────────────────────────────────────────────────────

local_nc: Optional[nats.NATS] = None
cloud_nc: Optional[nats.NATS] = None
policy_config: dict = {"outbound_rules": [], "inbound_rules": []}
local_subscriptions: list = []
cloud_subscriptions: list = []
_running = True

# Metrics
_metrics = {
    "messages_sent_to_cloud": 0,
    "messages_received_from_cloud": 0,
    "bytes_sent": 0,
    "bytes_received": 0,
    "reconnect_count": 0,
}


# ─── Policy Management ──────────────────────────────────────────────────────


async def fetch_initial_policy():
    """Fetch policy config from the control plane API on startup."""
    if not SITE_ID:
        logger.warning("agent.no_site_id", msg="SITE_ID not set, cannot fetch policies")
        return

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{GATEWAY_API_URL}/api/v1/policies/site/{SITE_ID}/compiled",
                timeout=10.0,
            )
            if resp.status_code == 200:
                await apply_policy(resp.json())
            else:
                logger.warning("agent.policy_fetch_failed", status=resp.status_code)
    except Exception as e:
        logger.warning("agent.policy_fetch_error", error=str(e))


async def apply_policy(config: dict):
    """Apply a new policy configuration — update subscriptions."""
    global policy_config

    old_version = policy_config.get("version")
    policy_config = config
    new_version = config.get("version")

    if old_version == new_version:
        return

    logger.info(
        "agent.policy_applied",
        version=new_version,
        outbound_rules=len(config.get("outbound_rules", [])),
        inbound_rules=len(config.get("inbound_rules", [])),
    )

    # Resubscribe to local NATS based on outbound rules
    await _update_local_subscriptions()


async def _update_local_subscriptions():
    """Subscribe to local NATS subjects matching outbound rules."""
    global local_subscriptions

    if not local_nc or not local_nc.is_connected:
        return

    # Unsubscribe from old subscriptions
    for sub in local_subscriptions:
        try:
            await sub.unsubscribe()
        except Exception:
            pass
    local_subscriptions.clear()

    # Subscribe to each outbound rule's subject pattern
    seen_patterns = set()
    for rule in policy_config.get("outbound_rules", []):
        pattern = rule.get("subject_pattern")
        if not pattern or pattern in seen_patterns:
            continue
        seen_patterns.add(pattern)

        try:
            sub = await local_nc.subscribe(pattern, cb=_on_local_message)
            local_subscriptions.append(sub)
            logger.debug("agent.subscribed_local", pattern=pattern)
        except Exception as e:
            logger.error("agent.subscribe_failed", pattern=pattern, error=str(e))

    logger.info("agent.local_subscriptions_updated", count=len(local_subscriptions))


async def handle_policy_update(msg: Msg):
    """Handle policy update pushed from the cloud control plane."""
    try:
        data = json.loads(msg.data.decode())
        logger.info("agent.policy_update_received")
        # Re-fetch full policy from API
        await fetch_initial_policy()
    except Exception as e:
        logger.error("agent.policy_update_error", error=str(e))


# ─── Message Forwarding ─────────────────────────────────────────────────────


async def _on_local_message(msg: Msg):
    """Forward a local NATS message to the cloud gateway."""
    if not cloud_nc or not cloud_nc.is_connected:
        return

    try:
        payload = msg.data.decode()
    except UnicodeDecodeError:
        payload = msg.data.hex()

    # Wrap in cloud envelope
    envelope = {
        "source_site_id": SITE_ID,
        "source_site_slug": SITE_SLUG,
        "subject": msg.subject,
        "data": json.loads(payload) if isinstance(payload, str) else payload,
        "timestamp": time.time(),
        "correlation_id": str(uuid.uuid4()),
        "hop_count": 0,
    }

    cloud_subject = f"cloud.site.{SITE_ID}.{msg.subject}"
    data = json.dumps(envelope).encode()

    try:
        await cloud_nc.publish(cloud_subject, data)
        _metrics["messages_sent_to_cloud"] += 1
        _metrics["bytes_sent"] += len(data)
    except Exception as e:
        logger.error("agent.cloud_publish_failed", subject=cloud_subject, error=str(e))


async def _on_cloud_message(msg: Msg):
    """Receive a message from the cloud and publish to local NATS."""
    if not local_nc or not local_nc.is_connected:
        return

    try:
        envelope = json.loads(msg.data.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return

    original_subject = envelope.get("subject")
    if not original_subject:
        return

    # Strip inbound prefix: cloud.site.<site_id>.inbound.<subject>
    data = envelope.get("data", {})
    data_with_cloud_context = {
        "source": "cloud",
        "source_site_id": envelope.get("source_site_id"),
        "source_site_slug": envelope.get("source_site_slug"),
        "correlation_id": envelope.get("correlation_id"),
        "data": data,
        "timestamp": envelope.get("timestamp"),
    }

    try:
        await local_nc.publish(original_subject, json.dumps(data_with_cloud_context).encode())
        _metrics["messages_received_from_cloud"] += 1
        _metrics["bytes_received"] += len(msg.data)
    except Exception as e:
        logger.error("agent.local_publish_failed", subject=original_subject, error=str(e))


# ─── Heartbeat ───────────────────────────────────────────────────────────────


async def _heartbeat_loop():
    """Send periodic heartbeats to the cloud gateway."""
    while _running:
        if cloud_nc and cloud_nc.is_connected:
            heartbeat = {
                "site_id": SITE_ID,
                "site_slug": SITE_SLUG,
                "agent_version": AGENT_VERSION,
                "timestamp": time.time(),
                "metrics": _metrics.copy(),
                "local_nats_connected": local_nc is not None and local_nc.is_connected,
                "subscription_count": len(local_subscriptions),
            }
            try:
                await cloud_nc.publish(
                    f"cloud.heartbeat.{SITE_ID}",
                    json.dumps(heartbeat).encode(),
                )
            except Exception as e:
                logger.warning("agent.heartbeat_failed", error=str(e))

        await asyncio.sleep(HEARTBEAT_INTERVAL)


# ─── Connection Management ───────────────────────────────────────────────────


def _build_tls_context() -> Optional[ssl.SSLContext]:
    """Build TLS context for mTLS connection to cloud gateway."""
    if not CLIENT_CERT_PATH or not CLIENT_KEY_PATH:
        return None

    ctx = ssl.create_default_context()
    if CA_CERT_PATH:
        ctx.load_verify_locations(CA_CERT_PATH)
    ctx.load_cert_chain(CLIENT_CERT_PATH, CLIENT_KEY_PATH)
    return ctx


async def connect_local():
    """Connect to the local Maestra NATS."""
    global local_nc
    local_nc = await nats.connect(LOCAL_NATS_URL)
    logger.info("agent.local_nats_connected", url=LOCAL_NATS_URL)


async def connect_cloud():
    """Connect to the cloud gateway NATS with optional mTLS."""
    global cloud_nc

    tls_ctx = _build_tls_context()
    connect_opts = {"servers": [CLOUD_NATS_URL]}
    if tls_ctx:
        connect_opts["tls"] = tls_ctx

    cloud_nc = await nats.connect(**connect_opts)
    logger.info("agent.cloud_nats_connected", url=CLOUD_NATS_URL)

    # Announce connection
    await cloud_nc.publish(
        "cloud.agent.connect",
        json.dumps({
            "site_id": SITE_ID,
            "site_slug": SITE_SLUG,
            "agent_version": AGENT_VERSION,
            "tags": json.loads(os.getenv("SITE_TAGS", "[]")),
            "region": os.getenv("SITE_REGION", ""),
        }).encode(),
    )

    # Subscribe to inbound messages
    global cloud_subscriptions
    sub = await cloud_nc.subscribe(
        f"cloud.site.{SITE_ID}.inbound.>", cb=_on_cloud_message
    )
    cloud_subscriptions.append(sub)

    # Subscribe to control plane updates
    sub = await cloud_nc.subscribe(
        f"cloud.control.{SITE_ID}.>", cb=handle_policy_update
    )
    cloud_subscriptions.append(sub)


async def main():
    """Main entry point for the Cloud Agent."""
    global _running

    if not SITE_ID:
        logger.error("agent.missing_config", msg="SITE_ID environment variable is required")
        return

    logger.info(
        "agent.starting",
        site_id=SITE_ID,
        site_slug=SITE_SLUG,
        version=AGENT_VERSION,
        local_nats=LOCAL_NATS_URL,
        cloud_nats=CLOUD_NATS_URL,
    )

    try:
        # Connect to local NATS
        await connect_local()

        # Connect to cloud NATS with retry
        delay = RECONNECT_BASE_DELAY
        while _running:
            try:
                await connect_cloud()
                break
            except Exception as e:
                logger.warning(
                    "agent.cloud_connect_retry",
                    error=str(e),
                    retry_in=delay,
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, RECONNECT_MAX_DELAY)
                _metrics["reconnect_count"] += 1

        # Fetch initial policy
        await fetch_initial_policy()

        # Update local subscriptions based on policy
        await _update_local_subscriptions()

        # Start heartbeat
        asyncio.create_task(_heartbeat_loop())

        logger.info("agent.running")

        # Keep running
        await asyncio.Event().wait()

    except KeyboardInterrupt:
        _running = False
    finally:
        _running = False

        # Announce disconnect
        if cloud_nc and cloud_nc.is_connected:
            try:
                await cloud_nc.publish(
                    "cloud.agent.disconnect",
                    json.dumps({"site_id": SITE_ID}).encode(),
                )
                await cloud_nc.flush()
            except Exception:
                pass

        # Clean up
        for sub in local_subscriptions + cloud_subscriptions:
            try:
                await sub.unsubscribe()
            except Exception:
                pass

        if local_nc:
            await local_nc.close()
        if cloud_nc:
            await cloud_nc.close()

        logger.info("agent.stopped")


if __name__ == "__main__":
    asyncio.run(main())
