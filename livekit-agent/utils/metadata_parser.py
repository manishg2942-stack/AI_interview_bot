import json
import logging

from livekit.agents import JobContext


log = logging.getLogger("metadata_parser")


def interview_context_from_job(ctx: JobContext) -> dict:
    metadata = getattr(ctx.job, "metadata", "") or ""
    if not metadata:
        return {}

    try:
        parsed = json.loads(metadata)
    except json.JSONDecodeError:
        log.warning("could not parse job metadata")
        return {}

    if not isinstance(parsed, dict):
        return {}

    return parsed
