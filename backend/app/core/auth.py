"""
API key authentication dependency.

When settings.api_key is empty, auth is disabled (dev convenience).
When set, all protected endpoints require X-API-Key header.
"""

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.core.config import settings

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    api_key: str | None = Security(_api_key_header),
) -> None:
    """FastAPI dependency: verify X-API-Key header.

    - If settings.api_key is empty → auth is disabled, always passes.
    - If settings.api_key is set → requires matching header.
    """
    if not settings.api_key:
        # Auth disabled in dev mode
        return

    if not api_key or api_key != settings.api_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing API key.",
        )
