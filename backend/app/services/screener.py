"""
Screening orchestrator — ties the full pipeline together.

Pipeline:
  1. Parse files → raw text
  2. Extract ResumeProfile + JobProfile (LLM, parallel)
  3. Compute deterministic match scores
  4. Generate LLM reasoning + semantic score
  5. Recompute final score with semantic score
  6. Return ScreeningOutput
"""

import asyncio
import logging

from app.schemas.resume import ResumeProfile
from app.schemas.job import JobProfile
from app.schemas.match import MatchResult, MatchReasoning, ScreeningOutput
from app.services.llm import (
    extract_resume_profile,
    extract_job_profile,
    generate_match_reasoning,
)
from app.services.matcher import compute_match

logger = logging.getLogger(__name__)


async def screen_candidate(
    resume_text: str,
    jd_text: str,
) -> ScreeningOutput:
    """Run the full screening pipeline for one candidate.

    Args:
        resume_text: Raw text extracted from a resume file.
        jd_text: Raw text extracted from a job description file.

    Returns:
        ScreeningOutput with extraction, scoring, and reasoning.

    Raises:
        ValueError: If either text is empty.
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is empty.")
    if not jd_text or not jd_text.strip():
        raise ValueError("Job description text is empty.")

    # ── Step 1: Structured extraction (parallel — halves LLM latency) ──
    logger.info("Extracting resume + job profiles in parallel...")
    resume_profile, job_profile = await asyncio.gather(
        extract_resume_profile(resume_text),
        extract_job_profile(jd_text),
    )

    # ── Step 2: Deterministic scoring (no LLM) ──────────
    logger.info("Computing deterministic match scores...")
    preliminary_match = compute_match(resume_profile, job_profile, semantic_score=0)

    # ── Step 3: LLM reasoning + semantic score ──────────
    logger.info("Generating LLM reasoning and semantic score...")
    reasoning, semantic_score = await generate_match_reasoning(
        resume_profile, job_profile, preliminary_match,
    )

    # ── Step 4: Recompute with semantic score ────────────
    final_match = compute_match(resume_profile, job_profile, semantic_score=semantic_score)

    logger.info(
        "Screening complete: %s → %s (score: %.1f)",
        resume_profile.name,
        reasoning.recommendation,
        final_match.final_score,
    )

    return ScreeningOutput(
        candidate_name=resume_profile.name,
        candidate_email=resume_profile.email,
        candidate_phone=resume_profile.phone,
        job_title=job_profile.job_title,
        match=final_match,
        reasoning=reasoning,
    )
