from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from config import get_settings
from app_logging import get_logger

logger = get_logger(__name__)


@dataclass(slots=True, frozen=True)
class SearchOutcome:
    snippets: list[str]
    citations: list[str]
    used: bool


class TavilyClient:
    """Thin wrapper around Tavily search API."""

    def __init__(self, api_key: str, *, timeout: float = 10.0) -> None:
        self._api_key = api_key
        self._timeout = timeout
        self._client = httpx.AsyncClient(timeout=self._timeout)

    async def search(self, query: str) -> list[dict[str, Any]]:
        payload = {
            "api_key": self._api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "include_images": False,
            "include_raw_content": False,
            "max_results": 5,
            "include_domains": [],
            "exclude_domains": [],
        }

        response = await self._client.post(
            "https://api.tavily.com/search", json=payload
        )
        response.raise_for_status()
        data = response.json()
        return data.get("results", [])

    async def aclose(self) -> None:
        await self._client.aclose()


async def maybe_search(query: str) -> SearchOutcome:
    """Perform search if enabled and API key provided."""

    settings = get_settings()
    if not settings.enable_search:
        return SearchOutcome([], [], False)

    if not settings.tavily_api_key:
        logger.debug("Search requested but Tavily API key missing")
        return SearchOutcome([], [], False)

    client = TavilyClient(settings.tavily_api_key)
    try:
        results = await client.search(query)
    except httpx.HTTPError as exc:
        logger.warning("Tavily search failed", error=str(exc))
        return SearchOutcome([], [], False)
    finally:
        await client.aclose()

    top = results[:3]
    citations: list[str] = []
    snippets: list[str] = []
    for result in top:
        title = result.get("title", "제목 없음")
        content = result.get("content", "")
        url = result.get("url", "")
        snippets.append(
            f"제목: {title}\n내용: {content}\n출처: {url}"
        )
        if url:
            citations.append(url)

    return SearchOutcome(snippets, citations, bool(snippets))
