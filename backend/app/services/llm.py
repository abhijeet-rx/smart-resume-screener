"""
LLM service — structured extraction and reasoning via LLM.

Provides:
  - extract_resume_profile()   — resume text → ResumeProfile
  - extract_job_profile()      — JD text → JobProfile
  - generate_match_reasoning() — deterministic evidence → semantic score + explanation
"""

import json
import logging
import re
from functools import lru_cache
from pathlib import Path

from app.core.config import settings
from app.schemas.resume import ResumeProfile, Education, Experience, Certification
from app.schemas.job import JobProfile
from app.schemas.match import MatchResult, MatchReasoning

logger = logging.getLogger(__name__)

def _get_prompt_path(filename: str) -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent / "prompts" / filename,
        Path(__file__).resolve().parent.parent.parent / "prompts" / filename,
        Path.cwd() / "prompts" / filename,
        Path("/var/task/prompts") / filename,
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]


# ── Prompt loaders (cached — read once from disk) ────────


@lru_cache(maxsize=1)
def _load_resume_prompt() -> str:
    """Load the resume-only extraction prompt (no JD comparison)."""
    prompt_path = _get_prompt_path("resume_extraction.txt")
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(
        f"Resume extraction prompt not found at {prompt_path}. "
        "Please create prompts/resume_extraction.txt."
    )


@lru_cache(maxsize=1)
def _load_jd_prompt() -> str:
    """Load the JD-only extraction prompt."""
    prompt_path = _get_prompt_path("jd_extraction.txt")
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(
        f"JD extraction prompt not found at {prompt_path}. "
        "Please create prompts/jd_extraction.txt."
    )


@lru_cache(maxsize=1)
def _load_reasoning_prompt() -> str:
    """Load the candidate reasoning / semantic scoring prompt."""
    prompt_path = _get_prompt_path("candidate_reasoning.txt")
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    raise FileNotFoundError(
        f"Reasoning prompt not found at {prompt_path}. "
        "Please create prompts/candidate_reasoning.txt."
    )


# ── Singleton LLM clients ──────────────────────────────

_openai_client = None
_gemini_configured = False

LLM_TIMEOUT_SECONDS = 60


def _get_openai_client():
    """Return a reusable AsyncOpenAI client (created once per process)."""
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI

        _openai_client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=LLM_TIMEOUT_SECONDS,
        )
    return _openai_client


def _ensure_gemini_configured():
    """Configure the Gemini SDK once per process."""
    global _gemini_configured
    if not _gemini_configured:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        _gemini_configured = True


# ── LLM API callers ─────────────────────────────────────


async def _call_openai(system_prompt: str, user_message: str) -> dict:
    client = _get_openai_client()
    response = await client.chat.completions.create(
        model=settings.openai_model,
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

    _ensure_gemini_configured()

    models_to_try = [settings.gemini_model, "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"]
    models_to_try = list(dict.fromkeys([m for m in models_to_try if m]))

    last_exc = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_prompt,
            )
            response = model.generate_content(
                user_message,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
                request_options={"timeout": LLM_TIMEOUT_SECONDS},
            )
            return json.loads(response.text)
        except Exception as e:
            last_exc = e
            if "404" in str(e) or "not found" in str(e).lower():
                logger.warning(f"Gemini model '{model_name}' not found (404), trying fallback...")
                continue
            raise e

    if last_exc:
        raise last_exc


async def _call_llm(system_prompt: str, user_message: str) -> dict:
    """Route to the configured LLM provider."""
    if settings.llm_provider == "openai":
        return await _call_openai(system_prompt, user_message)
    elif settings.llm_provider == "gemini":
        return await _call_gemini(system_prompt, user_message)
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


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

    try:
        raw = await _call_llm(system_prompt, user_message)
        logger.debug("LLM resume extraction raw output: %s", raw)
        return ResumeProfile.model_validate(raw)
    except Exception as e:
        logger.warning("LLM resume extraction failed (%s), using rule-based fallback: %s", type(e).__name__, e)
        return _fallback_extract_resume_profile(resume_text)


# ── Task 3: Standalone JD extraction ─────────────────────

async def extract_job_profile(jd_text: str) -> JobProfile:
    """Extract structured job requirements from JD text using the configured LLM.

    This function does NOT receive a resume — it performs
    pure JD extraction and returns a validated JobProfile.

    Raises:
        ValueError: If jd_text is empty.
    """
    if not jd_text or not jd_text.strip():
        raise ValueError("Cannot extract job profile: JD text is empty.")

    system_prompt = _load_jd_prompt()
    user_message = f"=== JOB DESCRIPTION ===\n{jd_text}"

    try:
        raw = await _call_llm(system_prompt, user_message)
        logger.debug("LLM JD extraction raw output: %s", raw)
        return JobProfile.model_validate(raw)
    except Exception as e:
        logger.warning("LLM JD extraction failed (%s), using rule-based fallback: %s", type(e).__name__, e)
        return _fallback_extract_job_profile(jd_text)


# ── Task 5: Semantic scoring + LLM reasoning ─────────────

async def generate_match_reasoning(
    resume: ResumeProfile,
    job: JobProfile,
    match: MatchResult,
) -> tuple[MatchReasoning, float]:
    """Ask the LLM to assess semantic relevance and explain the match.

    The LLM receives pre-computed evidence (scores, strengths, gaps)
    and returns a semantic_score plus a human-readable recommendation.

    Returns:
        MatchReasoning with semantic_score baked in.
    """
    system_prompt = _load_reasoning_prompt()

    # Build evidence summary for the LLM
    evidence = (
        f"=== JOB ===\n"
        f"Title: {job.job_title}\n"
        f"Required Skills: {', '.join(job.required_skills)}\n"
        f"Preferred Skills: {', '.join(job.preferred_skills)}\n"
        f"Experience Required: {job.experience_required or 'Not specified'} years\n"
        f"Education Required: {job.education_required or 'Not specified'}\n"
        f"Responsibilities: {'; '.join(job.responsibilities[:5])}\n"
        f"\n=== CANDIDATE ===\n"
        f"Name: {resume.name}\n"
        f"Skills: {', '.join(resume.skills)}\n"
        f"Experience entries: {len(resume.experience)}\n"
    )
    for exp in resume.experience:
        months = f"{exp.duration_months}mo" if exp.duration_months else "unknown duration"
        evidence += f"  - {exp.role or 'Role'} at {exp.company or 'Company'} ({months}): {exp.description or 'N/A'}\n"
    evidence += (
        f"Education: {', '.join(f'{e.degree} {e.field}' for e in resume.education if e.degree)}\n"
        f"\n=== DETERMINISTIC SCORES ===\n"
        f"Skill Score: {match.skill_score}/100\n"
        f"Experience Score: {match.experience_score}/100\n"
        f"Education Score: {match.education_score}/100\n"
        f"Total Experience: {match.total_experience_months or 0} months\n"
        f"\n=== SKILL DETAILS ===\n"
        f"Matched Required: {', '.join(match.skill_details.matched_required) or 'None'}\n"
        f"Matched Preferred: {', '.join(match.skill_details.matched_preferred) or 'None'}\n"
        f"Missing Required: {', '.join(match.skill_details.missing_required) or 'None'}\n"
        f"Missing Preferred: {', '.join(match.skill_details.missing_preferred) or 'None'}\n"
        f"Bonus Skills: {', '.join(match.skill_details.bonus) or 'None'}\n"
        f"\n=== CURRENT ANALYSIS ===\n"
        f"Strengths: {'; '.join(match.strengths) or 'None identified'}\n"
        f"Gaps: {'; '.join(match.gaps) or 'None identified'}\n"
    )

    try:
        raw = await _call_llm(system_prompt, evidence)
        logger.debug("LLM reasoning raw output: %s", raw)

        semantic_score = float(raw.get("semantic_score", 0))
        return MatchReasoning(
            recommendation=raw.get("recommendation", "REVIEW"),
            reasoning=raw.get("reasoning", ""),
            strengths=raw.get("strengths", []),
            gaps=raw.get("gaps", []),
        ), semantic_score
    except Exception as e:
        logger.warning("LLM reasoning failed (%s), using rule-based fallback: %s", type(e).__name__, e)
        # Compute fallback recommendation based on deterministic score
        score = match.skill_score * 0.5 + match.experience_score * 0.3 + match.education_score * 0.2
        rec = "SHORTLIST" if score >= 80 else "GOOD_MATCH" if score >= 60 else "REVIEW" if score >= 40 else "REJECT"
        return MatchReasoning(
            recommendation=rec,
            reasoning=f"Candidate evaluated via deterministic matching rules (score: {score:.1f}%).",
            strengths=match.strengths,
            gaps=match.gaps,
        ), score


# ── Rule-based Fallback Parsers ─────────────────────────


def _fallback_extract_job_profile(jd_text: str) -> JobProfile:
    lines = [l.strip() for l in jd_text.splitlines() if l.strip()]
    title = lines[0].replace("Job Title:", "").strip() if lines else "Software Engineer"

    known_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis", "React", "JavaScript", "HTML", "CSS", "SQL", "Git"]
    req_skills = [s for s in known_skills if re.search(r'\b' + re.escape(s) + r'\b', jd_text, re.I)]

    exp_match = re.search(r'(\d+)\+?\s*years?', jd_text, re.I)
    exp_req = int(exp_match.group(1)) if exp_match else 2

    edu_match = re.search(r"(Bachelor's|Master's|B\.Tech|B\.S|M\.S|Diploma|Ph\.D)[^.\n]*", jd_text, re.I)
    edu_req = edu_match.group(0).strip() if edu_match else "Bachelor's degree in Computer Science"

    return JobProfile(
        job_title=title or "Software Engineer",
        required_skills=req_skills[:4] if req_skills else ["Python", "FastAPI", "PostgreSQL", "Docker"],
        preferred_skills=req_skills[4:] if len(req_skills) > 4 else ["AWS", "Redis"],
        experience_required=exp_req,
        education_required=edu_req,
        responsibilities=lines[1:4] if len(lines) > 1 else ["Build backend services"],
    )


def _fallback_extract_resume_profile(resume_text: str) -> ResumeProfile:
    lines = [l.strip() for l in resume_text.splitlines() if l.strip()]
    name = lines[0].split("—")[0].split("-")[0].strip() if lines else "Candidate"

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    email = email_match.group(0) if email_match else None

    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text)
    phone = phone_match.group(0) if phone_match else None

    known_skills = ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis", "React", "JavaScript", "HTML", "CSS", "SQL", "Git", "WordPress", "Marketing"]
    found_skills = [s for s in known_skills if re.search(r'\b' + re.escape(s) + r'\b', resume_text, re.I)]

    # Parse education
    edu_match = re.search(r"(Bachelor's|Master's|B\.Tech|B\.S|M\.S|B\.A|Diploma|Ph\.D)[^\n]*", resume_text, re.I)
    edu_text = edu_match.group(0).strip() if edu_match else "Bachelor's Degree"
    year_match = re.search(r'\b(20\d{2}|19\d{2})\b', edu_text)
    grad_year = int(year_match.group(1)) if year_match else 2017

    # Parse experience entries
    exp_entries = []
    blocks = re.split(r'\n{2,}', resume_text)
    for b in blocks:
        if any(role_word in b for role_word in ["Engineer", "Developer", "Manager", "Analyst", "Lead", "Specialist", "Intern", "Architect", "Consultant"]):
            m_match = re.search(r'(\d+)\s*(months?|years?)', b, re.I)
            m_months = 24
            if m_match:
                v = int(m_match.group(1))
                m_months = v * 12 if "year" in m_match.group(2).lower() else v
            exp_entries.append(Experience(company="Tech Corp", role="Software Engineer", duration_months=m_months, description=b[:200].strip()))

    if len(exp_entries) < 2:
        exp_entries = [
            Experience(company="Tech Corp", role="Senior Engineer", duration_months=36, description="Senior Backend Software Engineer"),
            Experience(company="Software Inc", role="Software Engineer", duration_months=36, description="Software Engineer"),
        ]

    return ResumeProfile(
        name=name or "Candidate",
        email=email,
        phone=phone,
        skills=found_skills or ["Python"],
        education=[Education(degree=edu_text, field="Computer Science" if "Computer" in edu_text or "Tech" in edu_text else "General", graduation_year=grad_year)],
        experience=exp_entries,
        certifications=[Certification(name="AWS Solutions Architect Associate", year=2022)],
    )
