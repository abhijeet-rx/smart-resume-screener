"""
SQLAlchemy model for screening match results.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base, PortableUUID


class MatchResultDB(Base):
    __tablename__ = "match_results"
    __table_args__ = (
        Index("ix_match_results_job_score", "job_id", "final_score"),
    )

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(PortableUUID(), ForeignKey("jobs.id"), nullable=False, index=True)

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

    # Relationships
    job = relationship("Job", back_populates="match_results")

    def __repr__(self) -> str:
        return f"<MatchResult {self.id} – {self.candidate_name} ({self.final_score})>"

