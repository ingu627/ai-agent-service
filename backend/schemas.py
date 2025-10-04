from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message] = Field(default_factory=list)
    useSearch: bool = Field(default=False, alias="useSearch")

    model_config = {
        "populate_by_name": True,
        "alias_generator": lambda field: field,
    }


class ChatResponse(BaseModel):
    reply: str
    used_search: bool = Field(default=False, alias="usedSearch")
    model: Optional[str] = None
    latency_ms: Optional[int] = Field(default=None, alias="latencyMs")
    citations: list[str] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
    }
