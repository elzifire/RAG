from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Simple Qdrant Post API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "posts"
    qdrant_vector_size: int = 32


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
