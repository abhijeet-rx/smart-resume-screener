import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Smart Resume Screener"
    app_env: str = "development"
    debug: bool = True

    database_url: str = "sqlite:///./smart_resume_screener.db"

    @property
    def effective_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) and url == "sqlite:///./smart_resume_screener.db":
            return "sqlite:////tmp/smart_resume_screener.db"
        return url

    llm_provider: str = "openai"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openai_model: str = "gpt-4o"
    gemini_model: str = "gemini-1.5-flash"
    groq_model: str = "openai/gpt-oss-120b"

    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    max_upload_size_mb: int = 10
    upload_dir: str = "./uploads"

    @property
    def upload_path(self) -> Path:
        target = self.upload_dir
        if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) and target == "./uploads":
            target = "/tmp/uploads"
        p = Path(target)
        try:
            p.mkdir(parents=True, exist_ok=True)
        except Exception:
            p = Path("/tmp/uploads")
            p.mkdir(parents=True, exist_ok=True)
        return p

    api_key: str = ""

    rate_limit_screen: str = "10/minute"
    rate_limit_jobs: str = "20/minute"


settings = Settings()


