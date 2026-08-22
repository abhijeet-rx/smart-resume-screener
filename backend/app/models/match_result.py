"""
SQLAlchemy model for screening match results.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class MatchResultDB(Base):
    __tablename__ = "match_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)

    # Candidate info (denormalized for simplicity)
    candidate_name = Column(String(255), nullable=True)
    candidate_email = Column(String(255), nullable=True)
    candidate_phone = Column(String(100), nullable=True)
    resume_filename = Column(String(255), nullable=False)

    # Scores
    skill_score = Column(Float, nullable=True)
    semantic_score = Column(Float, nullable=True)
    experience_score = Column(Float, nullable=True)
    education_score = Column(Float, nullable=True)
    final_score = Column(Float, nullable=True)

    # Recommendation
    recommendation = Column(String(50), nullable=True)

    # Full JSON blobs for detail views
    resume_profile_json = Column(JSON, nullable=True)
    reasoning_json = Column(JSON, nullable=True)
    match_details_json = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<MatchResult {self.id} – {self.candidate_name} ({self.final_score})>"
