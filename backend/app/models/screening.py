"""
SQLAlchemy model for screening results.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_name = Column(String(255), nullable=True)
    candidate_email = Column(String(255), nullable=True)
    resume_filename = Column(String(255), nullable=False)
    jd_filename = Column(String(255), nullable=True)
    match_score = Column(Integer, nullable=True)
    recommendation = Column(String(50), nullable=True)
    result_json = Column(JSON, nullable=True)
    resume_text = Column(Text, nullable=True)
    jd_text = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Screening {self.id} – {self.candidate_name}>"
