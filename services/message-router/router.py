"""Maestra Cloud Gateway — Message Router.

Core routing service that receives messages from Cloud Agents via NATS
and routes them to destination sites based on policies.

Runs as the SYSTEM account on cloud NATS — has cross-account visibility.
"""

import asyncio
import json
import os
import time
import uuid
from typing import Optional

import nats
import redis.asyncio as redis
import structlog
from nats.aio.msg import Msg

logger = structlog.get_logger()

NATS_URL = os.getenv("CLOUD_NATS_URL", "nats://cloud-nats:4223")
REDIS_URL = os.getenv("REDIS_URL", "redis://gateway-redis:6380")

# Module-level clients
nc: Optional[nats.NATS] = None
rc: Optional[redis.Redis] = None

# In-memory state
connected_sites: dict[str, dict] = {}  # site_id -> {slug, tags, connected_at, ...}

# Metrics counters
_metrics = {
    "messages_routed": 0,
    "messages_rejected": 0,
    "messages_rate_limited": 0,
    "bytes_routed": 0,
}


async def handle_site_message(msg: Msg):
    """Process a message from a site's Cloud Agent.

    Messages arrive on: cloud.site.<site_id>.<original_subject>
    """
    subject = msg.subject
    parts = subject.split(".", 3)

    if len(parts) < 4:
        logger.warning("router.invalid_subject", subject=subject)
        return

    source_site_id = parts[2]
    original_subject = parts[3]

    # Verify site is connected and active
    if source_site_id not in connected_sites:
        logger.warning("router.unknown_site", site_id=source_site_id)
        _metrics["messages_rejected"] += 1
        return

    try:
        payload = json.loads(msg.data.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning("router.invalid_payload", site_id=source_site_id)
        _metrics["messages_rejected"] += 1
        return

    # Load policies from Redis cache
    policies = await _get_cached_policies(source_site_id)
    if not policies:
        logger.debug("router.no_policies", site_id=source_site_id)
        _metrics["messages_rejected"] += 1
        return

    # Evaluate outbound rules
    for rule in policies.get("outbound_rules", []):
        if not _subject_matches(rule["subject_pattern"], original_subject):
            continue

        if rule["action"] == "deny":
            _metrics["messages_rejected"] += 1
            return

        # Rate limiting check
        if rule.get("rate_limit"):
            if await _is_rate_limited(source_site_id, rule["id"], rule["rate_limit"], rule.get("rate_limit_window_seconds", 1)):
                _metrics["messages_rate_limited"] += 1
                continue

        # Sampling
        if rule.get("sample_rate") is not None:
            import random
            if random.random() > rule["sample_rate"]:
                continue

        # Resolve destinations
        destinations = _resolve_destinations(rule, source_site_id)

        # Build cloud envelope
        envelope = {
            "id": str(uuid.uuid4()),
            "source_site_id": source_site_id,
            "source_site_slug": connected_sites[source_site_id].get("slug", "unknown"),
            "subject": original_subject,
            "data": payload.get("data", payload),
            "timestamp": payload.get("timestamp", time.time()),
            "correlation_id": payload.get("correlation_id", str(uuid.uuid4())),
            "hop_count": payload.get("hop_count", 0) + 1,
            "policy_id": rule["id"],
            "routed_at": time.time(),
        }
        envelope_bytes = json.dumps(envelope).encode()

        # Route to each destination
        for dest_site_id in destinations:
            dest_subject = f"cloud.site.{dest_site_id}.inbound.{original_subject}"
            await nc.publish(dest_subject, envelope_bytes)

            _metrics["messages_routed"] += 1
            _metrics["bytes_routed"] += len(envelope_bytes)

            # Update throughput counters in Redis
            await _increment_throughput(source_site_id, dest_site_id, len(envelope_bytes))

        logger.debug(
            "router.message_routed",
            source=source_site_id,
            subject=original_subject,
            destinations=len(destinations),
            policy=rule["name"],
        )
        return  # First matching rule wins

    # No matching rule — implicit deny
    _metrics["messages_rejected"] += 1


async def handle_heartbeat(msg: Msg):
    """Process heartbeat from a Cloud Agent."""
    subject = msg.subject
    parts = subject.split(".")
    if len(parts) < 3:
        return

    site_id = parts[2]

    try:
        data = json.loads(msg.data.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return

    if site_id in connected_sites:
        connected_sites[site_id]["last_heartbeat"] = time.time()
        connected_sites[site_id]["agent_version"] = data.get("agent_version")
        connected_sites[site_id]["local_device_count"] = data.get("device_count", 0)

    # Update Redis with heartbeat
    if rc:
        await rc.hset(f"gateway:site:{site_id}", mapping={
            "last_heartbeat": str(time.time()),
            "agent_version": data.get("agent_version", ""),
            "device_count": str(data.get("device_count", 0)),
        })
        await rc.expire(f"gateway:site:{site_id}", 60)  # 60s TTL


async def handle_site_connect(msg: Msg):
    """Handle a Cloud Agent connecting."""
    try:
        data = json.loads(msg.data.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return

    site_id = data.get("site_id")
    if not site_id:
        return

    connected_sites[site_id] = {
        "slug": data.get("site_slug", "unknown"),
        "tags": data.get("tags", []),
        "connected_at": time.time(),
        "last_heartbeat": time.time(),
        "agent_version": data.get("agent_version"),
        "region": data.get("region"),
    }

    if rc:
        await rc.sadd("gateway:connected_sites", site_id)
        await rc.hset(f"gateway:site:{site_id}", mapping={
            "slug": data.get("site_slug", "unknown"),
            "connected_at": str(time.time()),
            "region": data.get("region", ""),
        })

    logger.info("router.site_connected", site_id=site_id, slug=data.get("site_slug"))

    # Send policy config to the agent
    policies = await _get_cached_policies(site_id)
    if policies:
        await nc.publish(
            f"cloud.control.{site_id}.policy_config",
            json.dumps(policies).encode(),
        )


async def handle_site_disconnect(msg: Msg):
    """Handle a Cloud Agent disconnecting."""
    try:
        data = json.loads(msg.data.decode())
    except (json.JSONDecodeError, UnicodeDecodeError):
        return

    site_id = data.get("site_id")
    if site_id and site_id in connected_sites:
        del connected_sites[site_id]

        if rc:
            await rc.srem("gateway:connected_sites", site_id)
            await rc.delete(f"gateway:site:{site_id}")

        logger.info("router.site_disconnected", site_id=site_id)


async def _get_cached_policies(site_id: str) -> Optional[dict]:
    """Get policies from Redis cache."""
    if not rc:
        return None
    raw = await rc.get(f"gateway:policy:{site_id}")
    if raw:
        policies = json.loads(raw)
        return {
            "outbound_rules": [p for p in policies if p.get("direction") == "outbound"],
            "inbound_rules": [p for p in policies if p.get("direction") == "inbound"],
        }
    return None


def _subject_matches(pattern: str, subject: str) -> bool:
    """NATS-style subject matching."""
    pattern_parts = pattern.split(".")
    subject_parts = subject.split(".")

    for i, p in enumerate(pattern_parts):
        if p == ">":
            return i < len(subject_parts)
        if i >= len(subject_parts):
            return False
        if p != "*" and p != subject_parts[i]:
            return False

    return len(pattern_parts) == len(subject_parts)


def _resolve_destinations(rule: dict, source_site_id: str) -> list[str]:
    """Resolve destination site IDs."""
    if rule.get("destination_site_ids"):
        return [
            sid for sid in rule["destination_site_ids"]
            if sid != source_site_id and sid in connected_sites
        ]

    if rule.get("destination_tags"):
        return [
            sid for sid, info in connected_sites.items()
            if sid != source_site_id
            and any(tag in info.get("tags", []) for tag in rule["destination_tags"])
        ]

    return [sid for sid in connected_sites if sid != source_site_id]


async def _is_rate_limited(site_id: str, policy_id: str, limit: int, window: int) -> bool:
    """Check rate limit via Redis sliding window."""
    if not rc:
        return False

    key = f"gateway:ratelimit:{site_id}:{policy_id}"
    now = time.time()

    pipe = rc.pipeline()
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zcard(key)
    pipe.zadd(key, {f"{now}": now})
    pipe.expire(key, window + 1)
    results = await pipe.execute()

    return results[1] >= limit


async def _increment_throughput(source: str, dest: str, bytes_count: int):
    """Increment throughput counters in Redis."""
    if not rc:
        return
    pipe = rc.pipeline()
    hour_key = time.strftime("%Y%m%d%H")
    pipe.hincrby(f"gateway:throughput:{source}:out:{hour_key}", "messages", 1)
    pipe.hincrby(f"gateway:throughput:{source}:out:{hour_key}", "bytes", bytes_count)
    pipe.hincrby(f"gateway:throughput:{dest}:in:{hour_key}", "messages", 1)
    pipe.hincrby(f"gateway:throughput:{dest}:in:{hour_key}", "bytes", bytes_count)
    pipe.expire(f"gateway:throughput:{source}:out:{hour_key}", 86400)
    pipe.expire(f"gateway:throughput:{dest}:in:{hour_key}", 86400)
    await pipe.execute()


async def _stale_connection_checker():
    """Periodically check for stale connections (no heartbeat in 60s)."""
    while True:
        await asyncio.sleep(15)
        now = time.time()
        stale = [
            sid for sid, info in connected_sites.items()
            if now - info.get("last_heartbeat", 0) > 60
        ]
        for sid in stale:
            logger.warning("router.stale_connection", site_id=sid)
            del connected_sites[sid]
            if rc:
                await rc.srem("gateway:connected_sites", sid)
                await rc.delete(f"gateway:site:{sid}")


async def main():
    """Start the message router."""
    global nc, rc

    # Connect to cloud NATS
    nc = await nats.connect(NATS_URL)
    logger.info("router.nats_connected", url=NATS_URL)

    # Connect to Redis
    rc = redis.from_url(REDIS_URL, decode_responses=True)
    logger.info("router.redis_connected", url=REDIS_URL)

    # Subscribe to site messages (all sites)
    await nc.subscribe("cloud.site.*.>", cb=handle_site_message)

    # Subscribe to heartbeats
    await nc.subscribe("cloud.heartbeat.*", cb=handle_heartbeat)

    # Subscribe to connect/disconnect events
    await nc.subscribe("cloud.agent.connect", cb=handle_site_connect)
    await nc.subscribe("cloud.agent.disconnect", cb=handle_site_disconnect)

    logger.info("router.started", subscriptions=[
        "cloud.site.*.>",
        "cloud.heartbeat.*",
        "cloud.agent.connect",
        "cloud.agent.disconnect",
    ])

    # Start background tasks
    asyncio.create_task(_stale_connection_checker())

    try:
        await asyncio.Event().wait()
    finally:
        await nc.close()
        await rc.close()
        logger.info("router.stopped")


if __name__ == "__main__":
    asyncio.run(main())
