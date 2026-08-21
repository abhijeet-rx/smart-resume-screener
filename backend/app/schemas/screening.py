"""
Pydantic schemas for request / response validation.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field


# ── Nested response objects ──────────────────────────────

class CandidateInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class SkillsMatch(BaseModel):
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)
    bonus: list[str] = Field(default_factory=list)


# ── Screening result ────────────────────────────────────

class ScreeningResult(BaseModel):
    candidate: CandidateInfo
    match_score: int = Field(ge=0, le=100)
    skills_match: SkillsMatch
    experience_summary: str = ""
    education_match: bool = False
    recommendation: str = "NO_MATCH"
    detailed_analysis: str = ""


# ── API response wrappers ───────────────────────────────

class ScreeningResponse(BaseModel):
    id: UUID
    resume_filename: str
    jd_filename: Optional[str] = None
    result: ScreeningResult
    created_at: datetime

    model_config = {"from_attributes": True}


class ScreeningListItem(BaseModel):
    id: UUID
    candidate_name: Optional[str] = None
    resume_filename: str
    match_score: Optional[int] = None
    recommendation: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
