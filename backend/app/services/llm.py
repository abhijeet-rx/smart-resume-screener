"""
LLM service — structured extraction and screening via LLM.

Provides:
  - extract_resume_profile()  (Task 2) — resume → ResumeProfile
  - extract_job_profile()     (Task 3) — JD → JobProfile
  - generate_match_reasoning() (Task 5) — evidence → explanation
  - screen_resume()           (legacy) — combined resume+JD screening
"""

import json
import logging
from pathlib import Path

from app.core.config import settings
from app.schemas.resume import ResumeProfile
from app.schemas.job import JobProfile

logger = logging.getLogger(__name__)

# Load prompt template at module level
_PROMPT_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"


# ── Prompt loaders ───────────────────────────────────────

def _load_prompt() -> str:
    """Load the screening prompt (resume + JD comparison)."""
    prompt_path = _PROMPT_DIR / "screen_resume.txt"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    # Fallback inline prompt
    return (
        "You are an expert technical recruiter. "
        "Analyze the following resume against the job description. "
        "Return ONLY valid JSON matching this schema:\n"
        "{\n"
        '  "candidate": {"name": str, "email": str, "phone": str},\n'
        '  "match_score": int (0-100),\n'
        '  "skills_match": {"matched": [str], "missing": [str], "bonus": [str]},\n'
        '  "experience_summary": str,\n'
        '  "education_match": bool,\n'
        '  "recommendation": "STRONG_MATCH" | "GOOD_MATCH" | "PARTIAL_MATCH" | "NO_MATCH",\n'
        '  "detailed_analysis": str\n'
        "}"
    )


def _load_resume_prompt() -> str:
    """Load the resume-only extraction prompt (no JD comparison)."""
    prompt_path = _PROMPT_DIR / "resume_extraction.txt"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(
        f"Resume extraction prompt not found at {prompt_path}. "
        "Please create prompts/resume_extraction.txt."
    )


def _load_jd_prompt() -> str:
    """Load the JD-only extraction prompt."""
    prompt_path = _PROMPT_DIR / "jd_extraction.txt"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(
        f"JD extraction prompt not found at {prompt_path}. "
        "Please create prompts/jd_extraction.txt."
    )


async def screen_resume(resume_text: str, jd_text: str) -> dict:
    """Call the configured LLM provider and return structured screening JSON."""
    system_prompt = _load_prompt()
    user_message = (
        f"=== RESUME ===\n{resume_text}\n\n"
        f"=== JOB DESCRIPTION ===\n{jd_text}"
    )

    if settings.llm_provider == "openai":
        return await _call_openai(system_prompt, user_message)
    elif settings.llm_provider == "gemini":
        return await _call_gemini(system_prompt, user_message)
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


async def _call_openai(system_prompt: str, user_message: str) -> dict:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
    )
    content = response.choices[0].message.content
    return json.loads(content)


async def _call_gemini(system_prompt: str, user_message: str) -> dict:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=system_prompt,
    )
    response = model.generate_content(
        user_message,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )
    return json.loads(response.text)


# ── Task 2: Standalone resume extraction ─────────────────

async def extract_resume_profile(resume_text: str) -> ResumeProfile:
    """Extract structured data from resume text using the configured LLM.

    This function does NOT receive a job description — it performs
    pure resume extraction and returns a validated ResumeProfile.

    Raises:
        ValueError: If resume_text is empty.
        json.JSONDecodeError: If the LLM returns invalid JSON.
        pydantic.ValidationError: If the JSON doesn't match ResumeProfile.
    """
    if not resume_text or not resume_text.strip():
        raise ValueError("Cannot extract profile: resume text is empty.")

    system_prompt = _load_resume_prompt()
    user_message = f"=== RESUME ===\n{resume_text}"

    if settings.llm_provider == "openai":
        raw = await _call_openai(system_prompt, user_message)
    elif settings.llm_provider == "gemini":
        raw = await _call_gemini(system_prompt, user_message)
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")

    logger.debug("LLM resume extraction raw output: %s", raw)

    # Validate against Pydantic model — raises ValidationError on mismatch
    return ResumeProfile.model_validate(raw)


# ── Task 3: Standalone JD extraction ─────────────────────

async def extract_job_profile(jd_text: str) -> JobProfile:
    """Extract structured job requirements from JD text using the configured LLM.

    This function does NOT receive a resume — it performs
    pure JD extraction and returns a validated JobProfile.

    Raises:
        ValueError: If jd_text is empty.
        json.JSONDecodeError: If the LLM returns invalid JSON.
        pydantic.ValidationError: If the JSON doesn't match JobProfile.
    """
    if not jd_text or not jd_text.strip():
        raise ValueError("Cannot extract job profile: JD text is empty.")

    system_prompt = _load_jd_prompt()
    user_message = f"=== JOB DESCRIPTION ===\n{jd_text}"

    if settings.llm_provider == "openai":
        raw = await _call_openai(system_prompt, user_message)
    elif settings.llm_provider == "gemini":
        raw = await _call_gemini(system_prompt, user_message)
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")

    logger.debug("LLM JD extraction raw output: %s", raw)
    return JobProfile.model_validate(raw)
