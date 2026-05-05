from __future__ import annotations

from typing import List

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Smart Cairo Transportation"
        API_PREFIX: str = "/api"
        VERSION: str = "1.1.0"
        ENVIRONMENT: str = "development"
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore",
        )

except ImportError:  # fallback for older environments
    from pydantic import BaseSettings

    class Settings(BaseSettings):
        PROJECT_NAME: str = "Smart Cairo Transportation"
        API_PREFIX: str = "/api"
        VERSION: str = "1.1.0"
        ENVIRONMENT: str = "development"
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]

        class Config:
            env_file = ".env"
            case_sensitive = True


settings = Settings()