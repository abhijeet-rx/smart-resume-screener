"""
Pydantic schemas for the matching engine output (Task 4 + 5).

These models hold deterministic scoring results and LLM-generated reasoning.
"""

from typing import Optional

from pydantic import BaseModel, Field


# ── Task 4: Deterministic matching ───────────────────────

class SkillMatchResult(BaseModel):
    """Breakdown of skill overlap between candidate and job."""
    matched_required: list[str] = Field(default_factory=list)
    matched_preferred: list[str] = Field(default_factory=list)
    missing_required: list[str] = Field(default_factory=list)
    missing_preferred: list[str] = Field(default_factory=list)
    bonus: list[str] = Field(default_factory=list)
    score: float = 0.0  # 0-100


class MatchResult(BaseModel):
    """Deterministic scores from the matching engine."""
    skill_score: float = 0.0        # 0-100
    semantic_score: float = 0.0     # 0-100 (LLM-assessed relevance)
    experience_score: float = 0.0   # 0-100
    education_score: float = 0.0    # 0-100
    final_score: float = 0.0       # 0-100 weighted
    skill_details: SkillMatchResult = Field(default_factory=SkillMatchResult)
    relevant_experience_months: Optional[int] = None
    total_experience_months: Optional[int] = None
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


# ── Task 5: LLM reasoning ───────────────────────────────

class MatchReasoning(BaseModel):
    """LLM-generated explanation based on deterministic evidence."""
    recommendation: str = "REVIEW"  # SHORTLIST | REVIEW | REJECT
    reasoning: str = ""
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)


# ── Combined output ─────────────────────────────────────

class ScreeningOutput(BaseModel):
    """Full screening result combining extraction, matching, and reasoning."""
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    job_title: Optional[str] = None
    match: MatchResult = Field(default_factory=MatchResult)
    reasoning: MatchReasoning = Field(default_factory=MatchReasoning)
