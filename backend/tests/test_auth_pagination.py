"""
Tests for API key authentication and pagination.

Auth tests: direct unit tests of the verify_api_key dependency.
Pagination tests: use FastAPI TestClient with SQLite in-memory DB.
"""

import pytest
import asyncio
import os

from fastapi import HTTPException

from app.core.auth import verify_api_key


# ── Auth tests ──────────────────────────────────────────


class TestAPIKeyAuth:
    """Test the X-API-Key authentication dependency."""

    def test_auth_disabled_when_key_empty(self, monkeypatch):
        """When api_key is empty, all endpoints should be accessible without a key."""
        from app.core import config
        monkeypatch.setattr(config.settings, "api_key", "")
        # Should not raise
        asyncio.run(verify_api_key(api_key=None))

    def test_auth_passes_with_correct_key(self, monkeypatch):
        """When api_key is set, providing the correct key should pass."""
        from app.core import config
        monkeypatch.setattr(config.settings, "api_key", "test-secret-key")
        # Should not raise
        asyncio.run(verify_api_key(api_key="test-secret-key"))

    def test_auth_rejects_wrong_key(self, monkeypatch):
        """When api_key is set, providing a wrong key should raise 403."""
        from app.core import config
        monkeypatch.setattr(config.settings, "api_key", "test-secret-key")
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(verify_api_key(api_key="wrong-key"))
        assert exc_info.value.status_code == 403

    def test_auth_rejects_missing_key(self, monkeypatch):
        """When api_key is set, omitting the key should raise 403."""
        from app.core import config
        monkeypatch.setattr(config.settings, "api_key", "test-secret-key")
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(verify_api_key(api_key=None))
        assert exc_info.value.status_code == 403

    def test_auth_rejects_empty_string_key(self, monkeypatch):
        """When api_key is set, providing empty string should raise 403."""
        from app.core import config
        monkeypatch.setattr(config.settings, "api_key", "test-secret-key")
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(verify_api_key(api_key=""))
        assert exc_info.value.status_code == 403


# ── Pagination tests (using SQLite in-memory) ───────────


@pytest.fixture()
def test_client(monkeypatch):
    """Create a TestClient backed by SQLite in-memory, no PostgreSQL needed."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from app.core import database

    # Use StaticPool so the same in-memory DB is shared across threads
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    test_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", test_session_factory)

    # Import all models so Base.metadata knows about them
    import app.models.job  # noqa: F401
    import app.models.match_result  # noqa: F401

    # Create tables in the test DB
    database.Base.metadata.create_all(bind=test_engine)

    from app.main import app
    from app.core.database import get_db
    from fastapi.testclient import TestClient

    def _override_get_db():
        db = test_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


class TestPaginationParams:
    """Test pagination query parameter validation."""

    def test_jobs_list_default_pagination(self, test_client):
        """GET /api/v1/jobs should return pagination metadata."""
        response = test_client.get("/api/v1/jobs")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert "jobs" in data
        assert data["skip"] == 0
        assert data["limit"] == 20
        assert data["total"] == 0

    def test_jobs_list_custom_pagination(self, test_client):
        """GET /api/v1/jobs with custom skip/limit."""
        response = test_client.get("/api/v1/jobs?skip=5&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["skip"] == 5
        assert data["limit"] == 10

    def test_jobs_list_invalid_skip(self, test_client):
        """Negative skip should be rejected."""
        response = test_client.get("/api/v1/jobs?skip=-1")
        assert response.status_code == 422

    def test_jobs_list_invalid_limit_too_high(self, test_client):
        """Limit above 100 should be rejected."""
        response = test_client.get("/api/v1/jobs?limit=200")
        assert response.status_code == 422

    def test_jobs_list_zero_limit(self, test_client):
        """Limit of 0 should be rejected (min is 1)."""
        response = test_client.get("/api/v1/jobs?limit=0")
        assert response.status_code == 422

    def test_health_endpoint(self, test_client):
        """Health check should still work."""
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "0.2.0"
