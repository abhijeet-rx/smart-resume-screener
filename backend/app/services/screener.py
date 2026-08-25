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
    pre_extracted_job_profile: JobProfile | None = None,
) -> ScreeningOutput:
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is empty.")
    if not jd_text or not jd_text.strip():
        raise ValueError("Job description text is empty.")

    if pre_extracted_job_profile:
        job_profile = pre_extracted_job_profile
        resume_profile = await extract_resume_profile(resume_text)
    else:
        logger.info("Extracting resume + job profiles in parallel...")
        resume_profile, job_profile = await asyncio.gather(
            extract_resume_profile(resume_text),
            extract_job_profile(jd_text),
        )

    logger.info("Computing deterministic match scores...")
    preliminary_match = compute_match(resume_profile, job_profile, semantic_score=0)

    logger.info("Generating LLM reasoning and semantic score...")
    reasoning, semantic_score = await generate_match_reasoning(
        resume_profile, job_profile, preliminary_match,
    )

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
        resume_profile=resume_profile,
    )

