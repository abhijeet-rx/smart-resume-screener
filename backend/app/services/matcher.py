"""
Deterministic matching engine (Task 4).

Computes evidence-based scores by comparing a ResumeProfile against a JobProfile.
The LLM does NOT decide the score — it only explains it later (Task 5).

Scoring weights:
  Skill Match       40%
  Semantic Match    30%  (placeholder until LLM semantic scoring in Task 5)
  Experience        20%
  Education         10%
"""

import logging
import re

from app.schemas.resume import ResumeProfile
from app.schemas.job import JobProfile
from app.schemas.match import SkillMatchResult, MatchResult

logger = logging.getLogger(__name__)

# ── Skill alias normalization ────────────────────────────
# Maps common variations to a canonical form for fair comparison.

_SKILL_ALIASES: dict[str, str] = {
    "js": "javascript",
    "javascript": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "react": "react",
    "react.js": "react",
    "reactjs": "react",
    "react js": "react",
    "vue": "vue",
    "vue.js": "vue",
    "vuejs": "vue",
    "angular": "angular",
    "angularjs": "angular",
    "angular.js": "angular",
    "node": "node.js",
    "node.js": "node.js",
    "nodejs": "node.js",
    "node js": "node.js",
    "express": "express",
    "express.js": "express",
    "expressjs": "express",
    "next": "next.js",
    "next.js": "next.js",
    "nextjs": "next.js",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "psql": "postgresql",
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "mysql": "mysql",
    "sql": "sql",
    "aws": "aws",
    "amazon web services": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "azure": "azure",
    "microsoft azure": "azure",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "kube": "kubernetes",
    "python": "python",
    "python3": "python",
    "py": "python",
    "java": "java",
    "c#": "c#",
    "csharp": "c#",
    "c sharp": "c#",
    "c++": "c++",
    "cpp": "c++",
    "go": "go",
    "golang": "go",
    "rust": "rust",
    "ruby": "ruby",
    "rails": "ruby on rails",
    "ruby on rails": "ruby on rails",
    "spring": "spring",
    "spring boot": "spring boot",
    "springboot": "spring boot",
    "django": "django",
    "flask": "flask",
    "fastapi": "fastapi",
    "fast api": "fastapi",
    "graphql": "graphql",
    "rest": "rest apis",
    "rest api": "rest apis",
    "rest apis": "rest apis",
    "restful": "rest apis",
    "restful api": "rest apis",
    "restful apis": "rest apis",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "ci cd": "ci/cd",
    "git": "git",
    "github": "github",
    "github actions": "github actions",
    "jenkins": "jenkins",
    "terraform": "terraform",
    "redis": "redis",
    "kafka": "kafka",
    "rabbitmq": "rabbitmq",
    "linux": "linux",
    "tailwind": "tailwind css",
    "tailwind css": "tailwind css",
    "tailwindcss": "tailwind css",
    "machine learning": "machine learning",
    "ml": "machine learning",
    "deep learning": "deep learning",
    "dl": "deep learning",
    "nlp": "nlp",
    "natural language processing": "nlp",
}


def _normalize_skill(skill: str) -> str:
    """Normalize a skill string for comparison."""
    key = skill.strip().lower()
    # Remove trailing punctuation
    key = re.sub(r"[,;.]+$", "", key)
    return _SKILL_ALIASES.get(key, key)


def _normalize_skill_set(skills: list[str]) -> dict[str, str]:
    """Return {normalized_key: original_display_name} for a skill list."""
    result: dict[str, str] = {}
    for s in skills:
        norm = _normalize_skill(s)
        if norm not in result:
            result[norm] = s  # keep first occurrence as display name
    return result


# ── Skill matching ───────────────────────────────────────

def match_skills(resume: ResumeProfile, job: JobProfile) -> SkillMatchResult:
    """Compare candidate skills against required/preferred job skills."""
    candidate = _normalize_skill_set(resume.skills)
    required = _normalize_skill_set(job.required_skills)
    preferred = _normalize_skill_set(job.preferred_skills)

    candidate_keys = set(candidate.keys())
    required_keys = set(required.keys())
    preferred_keys = set(preferred.keys())

    matched_req = candidate_keys & required_keys
    matched_pref = candidate_keys & preferred_keys
    missing_req = required_keys - candidate_keys
    missing_pref = preferred_keys - candidate_keys
    all_job_keys = required_keys | preferred_keys
    bonus_keys = candidate_keys - all_job_keys

    # Score: required skills are worth 80%, preferred 20%
    req_score = (len(matched_req) / len(required_keys) * 80) if required_keys else 80
    pref_score = (len(matched_pref) / len(preferred_keys) * 20) if preferred_keys else 20
    score = min(100.0, req_score + pref_score)

    return SkillMatchResult(
        matched_required=[required[k] for k in sorted(matched_req)],
        matched_preferred=[preferred[k] for k in sorted(matched_pref)],
        missing_required=[required[k] for k in sorted(missing_req)],
        missing_preferred=[preferred[k] for k in sorted(missing_pref)],
        bonus=[candidate[k] for k in sorted(bonus_keys)],
        score=round(score, 1),
    )


# ── Experience matching ──────────────────────────────────

def match_experience(resume: ResumeProfile, job: JobProfile) -> tuple[float, int]:
    """Score experience fit. Returns (score 0-100, total_months)."""
    total_months = 0
    for exp in resume.experience:
        if exp.duration_months and exp.duration_months > 0:
            total_months += exp.duration_months

    required_months = (job.experience_required or 0) * 12

    if required_months == 0:
        # No experience requirement stated → full marks
        return 100.0, total_months

    ratio = total_months / required_months
    # Generous curve: 80% of required = 70 score, 100% = 90, 120%+ = 100
    if ratio >= 1.2:
        score = 100.0
    elif ratio >= 1.0:
        score = 90.0 + (ratio - 1.0) * 50  # 90-100
    elif ratio >= 0.8:
        score = 70.0 + (ratio - 0.8) * 100  # 70-90
    elif ratio >= 0.5:
        score = 40.0 + (ratio - 0.5) * 100  # 40-70
    else:
        score = ratio * 80  # 0-40

    return round(min(100.0, score), 1), total_months


# ── Education matching ───────────────────────────────────

_DEGREE_LEVELS: dict[str, int] = {
    "phd": 4, "ph.d": 4, "doctorate": 4, "doctoral": 4,
    "master": 3, "masters": 3, "master's": 3, "m.s.": 3, "m.sc": 3,
    "msc": 3, "m.tech": 3, "mtech": 3, "m.e.": 3, "mba": 3, "m.a.": 3,
    "bachelor": 2, "bachelors": 2, "bachelor's": 2, "b.s.": 2, "b.sc": 2,
    "bsc": 2, "b.tech": 2, "btech": 2, "b.e.": 2, "b.a.": 2, "ba": 2,
    "associate": 1, "associates": 1, "associate's": 1, "diploma": 1,
}


def _extract_degree_level(text: str) -> int:
    """Extract the highest degree level from a text string."""
    if not text:
        return 0
    text_lower = text.lower()
    best = 0
    for keyword, level in _DEGREE_LEVELS.items():
        if keyword in text_lower:
            best = max(best, level)
    return best


def match_education(resume: ResumeProfile, job: JobProfile) -> float:
    """Score education fit (0-100)."""
    if not job.education_required:
        return 100.0  # No requirement → full marks

    required_level = _extract_degree_level(job.education_required)
    if required_level == 0:
        return 100.0  # Couldn't parse requirement → benefit of doubt

    # Find candidate's highest degree
    candidate_level = 0
    for edu in resume.education:
        degree_text = f"{edu.degree or ''} {edu.field or ''}"
        candidate_level = max(candidate_level, _extract_degree_level(degree_text))

    if candidate_level == 0 and resume.education:
        # Has education entries but we couldn't parse level → partial credit
        return 60.0

    if candidate_level == 0:
        return 20.0  # No education info at all

    if candidate_level >= required_level:
        return 100.0
    elif candidate_level == required_level - 1:
        return 65.0  # One level below
    else:
        return 30.0


# ── Strengths & Gaps ─────────────────────────────────────

def _build_strengths_gaps(
    skill_result: SkillMatchResult,
    exp_score: float,
    edu_score: float,
    total_months: int,
    job: JobProfile,
) -> tuple[list[str], list[str]]:
    """Generate human-readable strengths and gaps lists."""
    strengths: list[str] = []
    gaps: list[str] = []

    # Skills
    for s in skill_result.matched_required:
        strengths.append(f"Has required skill: {s}")
    for s in skill_result.matched_preferred:
        strengths.append(f"Has preferred skill: {s}")
    for s in skill_result.missing_required:
        gaps.append(f"Missing required skill: {s}")
    for s in skill_result.missing_preferred:
        gaps.append(f"Missing preferred skill: {s}")

    # Experience
    req_years = job.experience_required or 0
    actual_years = round(total_months / 12, 1)
    if exp_score >= 90:
        strengths.append(f"{actual_years} years of experience meets the {req_years}+ year requirement")
    elif exp_score >= 60:
        gaps.append(f"{actual_years} years of experience is slightly below the {req_years}+ year requirement")
    elif req_years > 0:
        gaps.append(f"Only {actual_years} years of experience vs {req_years}+ years required")

    # Education
    if edu_score >= 100:
        strengths.append("Education meets or exceeds requirement")
    elif edu_score >= 60:
        strengths.append("Has relevant educational background")
    elif job.education_required:
        gaps.append(f"Education may not fully meet requirement: {job.education_required}")

    return strengths, gaps


# ── Main entry point ─────────────────────────────────────

WEIGHTS = {
    "skill": 0.40,
    "semantic": 0.30,
    "experience": 0.20,
    "education": 0.10,
}


def compute_match(
    resume: ResumeProfile,
    job: JobProfile,
    semantic_score: float = 0.0,
) -> MatchResult:
    """Compute the full deterministic match between a resume and job.

    Args:
        resume: Structured resume profile.
        job: Structured job profile.
        semantic_score: LLM-assessed semantic relevance (0-100).
                       Defaults to 0; will be filled by Task 5.

    Returns:
        MatchResult with all scores, skill details, strengths, and gaps.
    """
    skill_result = match_skills(resume, job)
    exp_score, total_months = match_experience(resume, job)
    edu_score = match_education(resume, job)

    final = (
        WEIGHTS["skill"] * skill_result.score
        + WEIGHTS["semantic"] * semantic_score
        + WEIGHTS["experience"] * exp_score
        + WEIGHTS["education"] * edu_score
    )

    strengths, gaps = _build_strengths_gaps(
        skill_result, exp_score, edu_score, total_months, job,
    )

    return MatchResult(
        skill_score=skill_result.score,
        semantic_score=semantic_score,
        experience_score=exp_score,
        education_score=edu_score,
        final_score=round(final, 1),
        skill_details=skill_result,
        total_experience_months=total_months,
        strengths=strengths,
        gaps=gaps,
    )
