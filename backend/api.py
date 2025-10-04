from __future__ import annotations

import time
from collections.abc import Awaitable, Callable, Iterable
from typing import Protocol

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from app_logging import configure_logging, get_logger
from schemas import ChatRequest, ChatResponse, Message
from search import SearchOutcome, maybe_search
from services import ChatCompletionService

logger = get_logger(__name__)


def _build_system_search_message(snippets: Iterable[str]) -> Message:
    formatted = "\n\n".join(snippets)
    content = (
        "다음은 최신 검색 결과입니다.\n"
        "질문에 답변할 때 아래 정보를 우선적으로 참고하고,\n"
        "출처가 명확하지 않은 내용은 만들지 마세요.\n\n"
        f"{formatted}"
    )
    return Message(role="system", content=content)


class ChatServiceProtocol(Protocol):
    @property
    def model(self) -> str: ...

    async def complete(self, messages: Iterable[Message]) -> str: ...

    async def aclose(self) -> None: ...


def get_chat_service(request: Request) -> ChatServiceProtocol:
    state = request.app.state
    if not hasattr(state, "chat_service"):
        raise RuntimeError("Chat service is not initialised")
    return state.chat_service


def create_app(
    *,
    chat_service_factory: Callable[[], ChatServiceProtocol] = lambda: ChatCompletionService(),
    search_runner: Callable[[str], Awaitable[SearchOutcome]] = maybe_search,
) -> FastAPI:
    settings = get_settings()

    async def lifespan(app: FastAPI):
        configure_logging()
        logger.info("Starting AI Agent backend", env=settings.app_env)
        app.state.search_runner = search_runner
        chat_service = chat_service_factory()
        app.state.chat_service = chat_service
        try:
            yield
        finally:
            await chat_service.aclose()
            logger.info("Stopped AI Agent backend")

    app = FastAPI(
        title="AI Agent Backend",
        description="FastMCP-powered backend API for the AI Agent frontend",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/chat", response_model=ChatResponse)
    async def create_chat(
        chat_request: ChatRequest,
        request: Request,
        chat_service: ChatServiceProtocol = Depends(get_chat_service),
    ) -> ChatResponse:
        if not chat_request.messages:
            raise HTTPException(status_code=400, detail="messages 필드는 비어 있을 수 없습니다.")

        user_query = next(
            (
                message.content
                for message in reversed(chat_request.messages)
                if message.role == "user"
            ),
            None,
        )
        if user_query is None:
            raise HTTPException(status_code=400, detail="최소 한 개의 user 메시지가 필요합니다.")

        conversation = list(chat_request.messages)
        citations: list[str] = []
        used_search = False

        if getattr(chat_request, "useSearch", False):
            search_func = getattr(request.app.state, "search_runner", maybe_search)
            search_outcome = await search_func(user_query)
            if search_outcome.used:
                conversation.append(
                    _build_system_search_message(search_outcome.snippets)
                )
                citations = search_outcome.citations
                used_search = True

        start = time.perf_counter()
        reply = await chat_service.complete(conversation)
        latency_ms = int((time.perf_counter() - start) * 1000)

        return ChatResponse(
            reply=reply,
            used_search=used_search,
            model=chat_service.model,
            latency_ms=latency_ms,
            citations=citations,
        )

    return app


app = create_app()
