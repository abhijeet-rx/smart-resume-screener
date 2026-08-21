"""
Pydantic schemas for structured job description extraction (Task 3).

These models represent extracted job requirements independently
of any candidate resume — no matching, scoring, or recommendations.
"""

from typing import Optional

from pydantic import BaseModel, Field


class JobProfile(BaseModel):
    """Structured job description extracted by the LLM."""
    job_title: Optional[str] = None
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_required: Optional[int] = None  # years
    education_required: Optional[str] = None
    responsibilities: list[str] = Field(default_factory=list)
