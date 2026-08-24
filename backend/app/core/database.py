"""
SQLAlchemy engine, session factory, and portable UUID type.

The PortableUUID type stores UUIDs as CHAR(32) on SQLite and uses
the native UUID type on PostgreSQL, so the project works on both.
"""

import uuid as _uuid

from sqlalchemy import create_engine, String, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


# ── Portable UUID type ──────────────────────────────────
class PortableUUID(TypeDecorator):
    """Platform-agnostic UUID column.

    Uses PostgreSQL's native ``UUID`` when available, otherwise stores
    as ``CHAR(32)`` (hex, no dashes) for SQLite and other backends.
    """

    impl = String(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, _uuid.UUID) else _uuid.UUID(str(value))
        # SQLite / others: store as 32-char hex string
        if isinstance(value, _uuid.UUID):
            return value.hex
        return _uuid.UUID(str(value)).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, _uuid.UUID):
            return value
        return _uuid.UUID(str(value))


# ── Engine & session ────────────────────────────────────
db_url = settings.effective_database_url
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(
    db_url,
    echo=settings.debug,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


_tables_created = False

def get_db():
    """FastAPI dependency that yields a DB session."""
    global _tables_created
    if not _tables_created:
        try:
            Base.metadata.create_all(bind=engine)
            _tables_created = True
        except Exception:
            pass
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

