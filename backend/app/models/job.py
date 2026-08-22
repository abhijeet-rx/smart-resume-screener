"""
SQLAlchemy model for jobs.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base, PortableUUID


class Job(Base):
    __tablename__ = "jobs"

    id = Column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=True)
    description_text = Column(Text, nullable=False)
    profile_json = Column(JSON, nullable=True)  # Stored JobProfile
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    match_results = relationship(
        "MatchResultDB",
        back_populates="job",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return f"<Job {self.id} – {self.title}>"

