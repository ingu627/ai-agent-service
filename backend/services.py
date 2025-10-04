from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from openai import AsyncOpenAI

from config import get_settings
from app_logging import get_logger
from schemas import Message

logger = get_logger(__name__)


class ChatCompletionService:
    """Wrapper for OpenAI-compatible chat completion providers."""

    def __init__(self) -> None:
        settings = get_settings()
        provider = settings.llm_provider

        self._provider = provider
        self._client: AsyncOpenAI
        self._model: str
        self._request_overrides: dict[str, Any] = {}

        if provider == 'openai':
            if not settings.openai_api_key:
                raise RuntimeError(
                    "OPENAI_API_KEY 환경변수가 설정되지 않았습니다."
                )
            self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            self._model = settings.openai_model
        elif provider == 'perplexity':
            if not settings.perplexity_api_key:
                raise RuntimeError(
                    "PERPLEXITY_API_KEY 환경변수가 설정되지 않았습니다."
                )
            base_url = str(settings.perplexity_base_url)
            if not base_url.endswith('/'):
                base_url += '/'
            self._client = AsyncOpenAI(
                api_key=settings.perplexity_api_key,
                base_url=base_url,
            )
            self._model = settings.perplexity_model
        else:
            raise RuntimeError(f"지원하지 않는 LLM_PROVIDER 값입니다: {provider}")

        logger.info(
            "Chat completion provider initialised",
            provider=provider,
            model=self._model,
        )

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, messages: Iterable[Message]) -> str:
        payload = [message.model_dump() for message in messages]
        completion = await self._client.chat.completions.create(
            model=self._model,
            messages=payload,
            temperature=0.7,
            max_tokens=1000,
            **self._request_overrides,
        )
        choice = completion.choices[0]
        content = choice.message.content
        if content is None:
            raise RuntimeError("LLM 응답에서 메시지를 찾을 수 없습니다.")
        return content

    async def aclose(self) -> None:
        await self._client.close()
