"""
Smart Resume Screener — Core configuration.

Loads settings from environment variables via pydantic-settings.
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── App ──────────────────────────────────────────────
    app_name: str = "Smart Resume Screener"
    app_env: str = "development"
    debug: bool = True

    # ── Database ─────────────────────────────────────────
    database_url: str = "postgresql://postgres:postgres@localhost:5432/smart_resume_screener"

    # ── LLM ──────────────────────────────────────────────
    llm_provider: str = "openai"  # "openai" | "gemini"
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # ── CORS ─────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    # ── Upload ───────────────────────────────────────────
    max_upload_size_mb: int = 10
    upload_dir: str = "./uploads"

    @property
    def upload_path(self) -> Path:
        p = Path(self.upload_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    # ── Auth ─────────────────────────────────────────────
    api_key: str = ""  # When empty, auth is disabled (dev mode)

    # ── Rate Limiting ────────────────────────────────────
    rate_limit_screen: str = "10/minute"
    rate_limit_jobs: str = "20/minute"


settings = Settings()
