"""Policy engine — evaluates routing rules for cross-site messages.

Policies are cached in Redis and evaluated in priority order.
Changes are pushed to connected agents via NATS control subjects.
"""

import fnmatch
import hashlib
import json
import os
import random
import time
from typing import Optional
from uuid import UUID

import redis.asyncio as redis
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import RoutingPolicy, Site, PolicyDirection, PolicyAction
from models.schemas import PolicyTestResult

logger = structlog.get_logger()

REDIS_URL = os.getenv("REDIS_URL", "redis://gateway-redis:6380")

# Module-level clients
_redis: Optional[redis.Redis] = None
_nats = None  # Set by main.py after NATS connects


async def init(nats_client=None):
    """Initialize policy engine connections."""
    global _redis, _nats
    _redis = redis.from_url(REDIS_URL, decode_responses=True)
    _nats = nats_client
    logger.info("policy_engine.initialized")


async def close():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


def _subject_matches(pattern: str, subject: str) -> bool:
    """Check if a NATS subject matches a pattern.

    Supports:
      - `*` matches a single token
      - `>` matches one or more tokens (must be last)
      - Exact match
    """
    pattern_parts = pattern.split(".")
    subject_parts = subject.split(".")

    for i, p in enumerate(pattern_parts):
        if p == ">":
            return i < len(subject_parts)  # > must match at least one token
        if i >= len(subject_parts):
            return False
        if p != "*" and p != subject_parts[i]:
            return False

    return len(pattern_parts) == len(subject_parts)


def _policy_cache_key(site_id: str) -> str:
    return f"gateway:policy:{site_id}"


async def cache_policies(site_id: str, policies: list[dict]):
    """Cache a site's compiled policies in Redis."""
    if not _redis:
        return
    key = _policy_cache_key(site_id)
    await _redis.set(key, json.dumps(policies), ex=300)  # 5 min TTL


async def get_cached_policies(site_id: str) -> Optional[list[dict]]:
    """Get cached policies for a site."""
    if not _redis:
        return None
    key = _policy_cache_key(site_id)
    raw = await _redis.get(key)
    if raw:
        return json.loads(raw)
    return None


async def invalidate_cache(site_id: str):
    """Invalidate cached policies and notify the agent."""
    if _redis:
        await _redis.delete(_policy_cache_key(site_id))

    if _nats:
        await _nats.publish(
            f"cloud.control.{site_id}.policy_updated",
            json.dumps({"site_id": site_id, "timestamp": time.time()}).encode(),
        )
        logger.info("policy_engine.cache_invalidated", site_id=site_id)


async def load_policies(db: AsyncSession, site_id: UUID) -> list[dict]:
    """Load and compile policies for a site from DB, with caching."""
    site_id_str = str(site_id)

    # Check cache first
    cached = await get_cached_policies(site_id_str)
    if cached is not None:
        return cached

    # Load from DB
    result = await db.execute(
        select(RoutingPolicy)
        .where(RoutingPolicy.site_id == site_id, RoutingPolicy.enabled.is_(True))
        .order_by(RoutingPolicy.priority.asc())
    )
    policies = result.scalars().all()

    compiled = []
    for p in policies:
        compiled.append({
            "id": str(p.id),
            "name": p.name,
            "direction": p.direction.value if hasattr(p.direction, "value") else p.direction,
            "action": p.action.value if hasattr(p.action, "value") else p.action,
            "subject_pattern": p.subject_pattern,
            "destination_site_ids": [str(sid) for sid in (p.destination_site_ids or [])],
            "destination_tags": p.destination_tags or [],
            "source_site_ids": [str(sid) for sid in (p.source_site_ids or [])],
            "rate_limit": p.rate_limit,
            "rate_limit_window_seconds": p.rate_limit_window_seconds or 1,
            "sample_rate": float(p.sample_rate) if p.sample_rate else None,
            "transforms": p.transforms or [],
            "priority": p.priority,
        })

    await cache_policies(site_id_str, compiled)
    return compiled


async def evaluate(
    db: AsyncSession,
    source_site_id: UUID,
    subject: str,
    connected_sites: dict[str, dict],
) -> PolicyTestResult:
    """Evaluate a message against a site's outbound policies.

    Returns the first matching policy result, evaluated in priority order.
    """
    policies = await load_policies(db, source_site_id)
    source_str = str(source_site_id)

    for policy in policies:
        if policy["direction"] != "outbound":
            continue

        if not _subject_matches(policy["subject_pattern"], subject):
            continue

        # Check rate limit
        if policy["rate_limit"] and _redis:
            rate_limited = await _check_rate_limit(
                source_str,
                policy["id"],
                policy["rate_limit"],
                policy["rate_limit_window_seconds"],
            )
            if rate_limited:
                return PolicyTestResult(
                    matched=True,
                    policy_id=UUID(policy["id"]),
                    policy_name=policy["name"],
                    action=policy["action"],
                    destinations=[],
                    rate_limited=True,
                )

        # Check sampling
        if policy["sample_rate"] is not None:
            if random.random() > policy["sample_rate"]:
                return PolicyTestResult(
                    matched=True,
                    policy_id=UUID(policy["id"]),
                    policy_name=policy["name"],
                    action=policy["action"],
                    destinations=[],
                    would_sample=True,
                )

        # Resolve destinations
        destinations = _resolve_destinations(
            policy, connected_sites, source_str
        )

        if policy["action"] == "deny":
            return PolicyTestResult(
                matched=True,
                policy_id=UUID(policy["id"]),
                policy_name=policy["name"],
                action="deny",
                destinations=[],
            )

        return PolicyTestResult(
            matched=True,
            policy_id=UUID(policy["id"]),
            policy_name=policy["name"],
            action=policy["action"],
            destinations=[UUID(d) for d in destinations],
            would_transform=len(policy["transforms"]) > 0,
        )

    # No matching policy — default deny
    return PolicyTestResult(matched=False)


def _resolve_destinations(
    policy: dict, connected_sites: dict[str, dict], source_site_id: str
) -> list[str]:
    """Resolve destination site IDs from policy rules."""
    # Explicit site IDs
    if policy["destination_site_ids"]:
        return [
            sid for sid in policy["destination_site_ids"]
            if sid != source_site_id and sid in connected_sites
        ]

    # Tag-based routing
    if policy["destination_tags"]:
        matched = []
        for sid, info in connected_sites.items():
            if sid == source_site_id:
                continue
            site_tags = info.get("tags", [])
            if any(tag in site_tags for tag in policy["destination_tags"]):
                matched.append(sid)
        return matched

    # No filter = all connected sites (except source)
    return [sid for sid in connected_sites if sid != source_site_id]


async def _check_rate_limit(
    site_id: str, policy_id: str, limit: int, window_seconds: int
) -> bool:
    """Token bucket rate limiting via Redis."""
    key = f"gateway:ratelimit:{site_id}:{policy_id}"
    now = time.time()

    pipe = _redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    pipe.zcard(key)
    pipe.zadd(key, {f"{now}:{random.random()}": now})
    pipe.expire(key, window_seconds + 1)
    results = await pipe.execute()

    current_count = results[1]
    return current_count >= limit


async def get_site_policies_for_agent(db: AsyncSession, site_id: UUID) -> dict:
    """Get the full policy configuration for a Cloud Agent.

    This is what gets pushed to the agent on connect and on policy change.
    """
    policies = await load_policies(db, site_id)
    return {
        "site_id": str(site_id),
        "version": hashlib.md5(json.dumps(policies).encode()).hexdigest()[:8],
        "outbound_rules": [p for p in policies if p["direction"] == "outbound"],
        "inbound_rules": [p for p in policies if p["direction"] == "inbound"],
    }
