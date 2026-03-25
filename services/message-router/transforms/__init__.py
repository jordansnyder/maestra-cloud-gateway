"""Message transform pipeline.

Transforms are applied to messages before routing, as configured in policies.
Each transform is a function that takes a message dict and returns a modified dict.
"""

from typing import Callable

# Transform registry
_transforms: dict[str, Callable] = {}


def register(name: str):
    """Decorator to register a transform function."""
    def decorator(func):
        _transforms[name] = func
        return func
    return decorator


async def apply(transform_configs: list[dict], message: dict) -> dict:
    """Apply a pipeline of transforms to a message."""
    result = message.copy()
    for config in transform_configs:
        transform_type = config.get("type")
        transform_fn = _transforms.get(transform_type)
        if transform_fn:
            result = await transform_fn(result, config.get("config", {}))
    return result


# ─── Built-in Transforms ────────────────────────────────────────────────


@register("strip_fields")
async def strip_fields(message: dict, config: dict) -> dict:
    """Remove specified fields from the message data."""
    fields = config.get("fields", [])
    data = message.get("data", {})
    if isinstance(data, dict):
        for field in fields:
            data.pop(field, None)
        message["data"] = data
    return message


@register("rename_subject")
async def rename_subject(message: dict, config: dict) -> dict:
    """Rename/rewrite the message subject."""
    prefix = config.get("prefix", "")
    suffix = config.get("suffix", "")
    replace_from = config.get("replace_from", "")
    replace_to = config.get("replace_to", "")

    subject = message.get("subject", "")
    if replace_from:
        subject = subject.replace(replace_from, replace_to)
    if prefix:
        subject = f"{prefix}.{subject}"
    if suffix:
        subject = f"{subject}.{suffix}"
    message["subject"] = subject
    return message


@register("filter_fields")
async def filter_fields(message: dict, config: dict) -> dict:
    """Keep only specified fields in the message data."""
    fields = config.get("fields", [])
    data = message.get("data", {})
    if isinstance(data, dict) and fields:
        message["data"] = {k: v for k, v in data.items() if k in fields}
    return message


@register("add_metadata")
async def add_metadata(message: dict, config: dict) -> dict:
    """Add static metadata to the message."""
    metadata = config.get("metadata", {})
    data = message.get("data", {})
    if isinstance(data, dict):
        data["_cloud_metadata"] = metadata
        message["data"] = data
    return message


@register("throttle_precision")
async def throttle_precision(message: dict, config: dict) -> dict:
    """Reduce numeric precision to save bandwidth."""
    decimals = config.get("decimals", 2)
    data = message.get("data", {})
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, float):
                data[key] = round(value, decimals)
        message["data"] = data
    return message
