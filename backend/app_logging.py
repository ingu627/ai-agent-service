from __future__ import annotations

import logging
from typing import Any

import structlog

from config import get_settings


def configure_logging() -> None:
    """Configure structlog and standard logging according to settings."""

    settings = get_settings()
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    shared_processors: list[structlog.types.Processor] = [
        timestamper,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.log_json:
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            *shared_processors,
            renderer,
        ],
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(level=settings.log_level)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a structlog logger."""

    return structlog.get_logger(name)
