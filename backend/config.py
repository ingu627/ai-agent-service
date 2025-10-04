from __future__ import annotations

from functools import lru_cache
from typing import Literal, Optional

from pydantic import Field, HttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=('.env',), extra='ignore')

    app_env: Literal['development', 'production', 'test'] = Field(
        default='development', alias='APP_ENV'
    )
    llm_provider: Literal['openai', 'perplexity'] = Field(
        default='openai', alias='LLM_PROVIDER'
    )
    openai_api_key: Optional[str] = Field(default=None, alias='OPENAI_API_KEY')
    openai_model: str = Field(default='gpt-4o-mini', alias='OPENAI_MODEL')
    perplexity_api_key: Optional[str] = Field(
        default=None, alias='PERPLEXITY_API_KEY'
    )
    perplexity_model: str = Field(
        default='llama-3.1-sonar-large-128k-online', alias='PERPLEXITY_MODEL'
    )
    perplexity_base_url: HttpUrl = Field(
        default='https://api.perplexity.ai', alias='PERPLEXITY_BASE_URL'
    )
    tavily_api_key: Optional[str] = Field(default=None, alias='TAVILY_API_KEY')
    enable_search: bool = Field(default=True, alias='ENABLE_SEARCH')
    backend_host: str = Field(default='0.0.0.0', alias='BACKEND_HOST')
    backend_port: int = Field(default=8000, alias='BACKEND_PORT')
    allow_origins: list[str] | str = Field(
        default_factory=lambda: ['http://localhost:3000'],
        alias='ALLOWED_ORIGINS',
    )
    log_level: str = Field(default='INFO', alias='LOG_LEVEL')
    log_json: bool = Field(default=False, alias='LOG_JSON')
    fastmcp_transport: Literal['stdio', 'http', 'sse'] = Field(
        default='http', alias='FASTMCP_TRANSPORT'
    )
    fastmcp_http_path: str = Field(default='/mcp', alias='FASTMCP_HTTP_PATH')
    fastmcp_http_url: Optional[HttpUrl] = Field(
        default=None, alias='FASTMCP_HTTP_URL'
    )

    @field_validator('allow_origins', mode='before')
    @classmethod
    def _convert_allow_origins(cls, value: list[str] | str) -> list[str] | None:
        if isinstance(value, str):
            items = [item.strip() for item in value.split(',') if item.strip()]
            return items or ['http://localhost:3000']
        return value

    @field_validator('fastmcp_http_url', mode='before')
    @classmethod
    def _normalize_fastmcp_http_url(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()  # type: ignore[call-arg]
