#!/usr/bin/env python3
"""Backend 서버 시작 스크립트"""

from __future__ import annotations

import uvicorn

from config import get_settings


def main() -> None:
    settings = get_settings()
    
    print(f"Starting AI Agent Backend on {settings.backend_host}:{settings.backend_port}")
    print(f"Environment: {settings.app_env}")
    print(f"LLM Provider: {settings.llm_provider}")
    
    uvicorn.run(
        "api:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.app_env == "development",
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
