"""
Deterministic matching engine (Task 4).

Computes evidence-based scores by comparing a ResumeProfile against a JobProfile:
  - Semantic Skill Matching (exact, alias, and technology domain relationships)
  - Relevant Experience Scoring (calculates software/domain relevant experience vs total experience)
  - Education Level & Field Relevance (evaluates degree level AND degree field relevance)

Scoring weights:
  Skill Match       40%
  Semantic Match    30%  (assessed via LLM semantic reasoning)
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

# ── Semantic Skill Relationships ────────────────────────
# Parent required skill -> set of child/related frameworks & libraries that imply expertise.

_SKILL_RELATIONSHIPS: dict[str, set[str]] = {
    "machine learning": {
        "tensorflow", "pytorch", "scikit-learn", "sklearn", "keras", "deep learning",
        "nlp", "computer vision", "xgboost", "lightgbm", "transformers", "huggingface"
    },
    "deep learning": {"tensorflow", "pytorch", "keras", "neural networks", "transformers"},
    "python": {"django", "flask", "fastapi", "pandas", "numpy", "scipy", "pytest", "celery"},
    "react": {"next.js", "redux", "react native", "jsx", "tsx", "zustand"},
    "node.js": {"express", "nestjs", "koa", "fastify"},
    "javascript": {"typescript", "react", "vue", "angular", "node.js", "express"},
    "aws": {"ec2", "s3", "rds", "lambda", "ecs", "eks", "cloudformation", "dynamodb"},
    "kubernetes": {"helm", "k8s", "kubectl", "istio"},
    "postgresql": {"sql", "psql", "pl/pgsql"},
    "database": {"postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sql"},
    "ci/cd": {"github actions", "jenkins", "gitlab ci", "circleci", "travis ci"},
}


def _normalize_skill(skill: str) -> str:
    """Normalize a skill string for comparison."""
    key = skill.strip().lower()
    key = re.sub(r"[,;.]+$", "", key)
    return _SKILL_ALIASES.get(key, key)


def _normalize_skill_set(skills: list[str]) -> dict[str, str]:
    """Return {normalized_key: original_display_name} for a skill list."""
    result: dict[str, str] = {}
    for s in skills:
        norm = _normalize_skill(s)
        if norm not in result:
            result[norm] = s
    return result


# ── Skill matching with Semantic Relationships ──────────

def match_skills(resume: ResumeProfile, job: JobProfile) -> SkillMatchResult:
    """Compare candidate skills against required/preferred job skills,
    including semantic relationships (e.g. PyTorch -> Machine Learning)."""
    candidate = _normalize_skill_set(resume.skills)
    required = _normalize_skill_set(job.required_skills)
    preferred = _normalize_skill_set(job.preferred_skills)

    candidate_keys = set(candidate.keys())
    required_keys = set(required.keys())
    preferred_keys = set(preferred.keys())

    matched_req = set(candidate_keys & required_keys)
    matched_pref = set(candidate_keys & preferred_keys)
    missing_req = required_keys - candidate_keys
    missing_pref = preferred_keys - candidate_keys

    # Check semantic relationships for missing skills
    semantic_req_hits: dict[str, str] = {}  # req_skill -> candidate_child_skill
    for req_key in list(missing_req):
        related = _SKILL_RELATIONSHIPS.get(req_key, set())
        child_match = candidate_keys & related
        if child_match:
            matched_child = candidate[next(iter(child_match))]
            semantic_req_hits[req_key] = matched_child
            matched_req.add(req_key)
            missing_req.remove(req_key)

    all_job_keys = required_keys | preferred_keys
    bonus_keys = candidate_keys - all_job_keys

    # Calculate score (semantic matches get 0.85 weight credit)
    if required_keys:
        direct_hits = len(matched_req) - len(semantic_req_hits)
        sem_hits = len(semantic_req_hits)
        req_score = ((direct_hits + sem_hits * 0.85) / len(required_keys)) * 80
    else:
        req_score = 80.0

    pref_score = (len(matched_pref) / len(preferred_keys) * 20) if preferred_keys else 20.0
    score = min(100.0, req_score + pref_score)

    # Format display names with semantic notes if applicable
    matched_req_names = []
    for k in sorted(matched_req):
        if k in semantic_req_hits:
            matched_req_names.append(f"{required[k]} (via {semantic_req_hits[k]})")
        else:
            matched_req_names.append(required[k])

    return SkillMatchResult(
        matched_required=matched_req_names,
        matched_preferred=[preferred[k] for k in sorted(matched_pref)],
        missing_required=[required[k] for k in sorted(missing_req)],
        missing_preferred=[preferred[k] for k in sorted(missing_pref)],
        bonus=[candidate[k] for k in sorted(bonus_keys)],
        score=round(score, 1),
    )


# ── Relevant Experience Matching ─────────────────────────

def _extract_job_keywords(job: JobProfile) -> set[str]:
    """Extract relevant domain & technical keywords from job profile."""
    keywords = set()
    for s in job.required_skills + job.preferred_skills:
        keywords.add(_normalize_skill(s))
    if job.job_title:
        for word in re.findall(r"\w+", job.job_title.lower()):
            if len(word) > 2 and word not in {"senior", "junior", "lead", "staff", "principal", "engineer", "developer", "manager"}:
                keywords.add(word)
    return keywords


def _is_experience_relevant(role: str, desc: str, keywords: set[str]) -> bool:
    """Check if an experience entry is relevant to the job domain/skills."""
    if not keywords:
        return True  # If job specifies no domain/skills, all experience is counted
    text = f"{role or ''} {desc or ''}".lower()
    if not text.strip():
        return True  # Benefit of doubt if role/desc is minimal
    return any(kw in text for kw in keywords)


def match_experience(resume: ResumeProfile, job: JobProfile) -> tuple[float, int, int]:
    """Score RELEVANT experience fit. Returns (score 0-100, relevant_months, total_months)."""
    from app.services.experience_calculator import compute_resume_experience_metrics
    job_keywords = _extract_job_keywords(job)

    metrics = compute_resume_experience_metrics(resume.experience, job_keywords)
    relevant_months = metrics["relevant_experience_months"]
    total_months = metrics["total_experience_months"]

    required_months = (job.experience_required or 0) * 12

    if required_months == 0:
        return 100.0, relevant_months, total_months

    effective_months = relevant_months if relevant_months > 0 else int(total_months * 0.5)

    ratio = effective_months / required_months
    if ratio >= 1.2:
        score = 100.0
    elif ratio >= 1.0:
        score = 90.0 + (ratio - 1.0) * 50
    elif ratio >= 0.8:
        score = 70.0 + (ratio - 0.8) * 100
    elif ratio >= 0.5:
        score = 40.0 + (ratio - 0.5) * 100
    else:
        score = ratio * 80

    return round(min(100.0, score), 1), relevant_months, total_months


# ── Education Degree & Field Matching ─────────────────────

_DEGREE_LEVELS: dict[str, int] = {
    "phd": 4, "ph.d": 4, "doctorate": 4, "doctoral": 4,
    "master": 3, "masters": 3, "master's": 3, "m.s.": 3, "m.sc": 3,
    "msc": 3, "m.tech": 3, "mtech": 3, "m.e.": 3, "mba": 3, "m.a.": 3,
    "bachelor": 2, "bachelors": 2, "bachelor's": 2, "b.s.": 2, "b.sc": 2,
    "bsc": 2, "b.tech": 2, "btech": 2, "b.e.": 2, "b.a.": 2, "ba": 2,
    "associate": 1, "associates": 1, "associate's": 1, "diploma": 1,
}

_CS_STEM_FIELDS: set[str] = {
    "computer science", "cs", "software engineering", "computer engineering",
    "information technology", "it", "data science", "information systems",
    "electrical engineering", "mathematics", "math", "physics", "stem", "engineering"
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


def _is_field_relevant(candidate_field: str, required_text: str) -> bool:
    """Check if candidate field matches the required field or domain."""
    if not candidate_field or not required_text:
        return True  # If not specified, give benefit of doubt
    
    cand_lower = candidate_field.lower()
    req_lower = required_text.lower()

    # Direct match or substring
    if cand_lower in req_lower or req_lower in cand_lower:
        return True

    # If job specifies CS/Engineering/STEM and candidate studied CS/STEM
    req_is_cs = any(field in req_lower for field in ["computer", "software", "cs", "engineering", "it", "data science"])
    cand_is_cs = any(field in cand_lower for field in _CS_STEM_FIELDS)

    if req_is_cs and cand_is_cs:
        return True
    if not req_is_cs:
        return True

    return False


def match_education(resume: ResumeProfile, job: JobProfile) -> tuple[float, bool]:
    """Score education fit (0-100) taking into account degree level AND field relevance.
    Returns (score, field_is_relevant)."""
    if not job.education_required:
        return 100.0, True

    required_level = _extract_degree_level(job.education_required)
    if required_level == 0:
        return 100.0, True

    candidate_level = 0
    candidate_field = ""
    for edu in resume.education:
        degree_text = f"{edu.degree or ''} {edu.field or ''}"
        lvl = _extract_degree_level(degree_text)
        if lvl > candidate_level:
            candidate_level = lvl
            candidate_field = edu.field or ""

    if candidate_level == 0 and resume.education:
        return 60.0, True

    if candidate_level == 0:
        return 20.0, False

    field_relevant = _is_field_relevant(candidate_field, job.education_required)

    # Calculate base degree level score
    if candidate_level >= required_level:
        base_score = 100.0
    elif candidate_level == required_level - 1:
        base_score = 65.0
    else:
        base_score = 30.0

    # Apply field relevance multiplier if level matches but field is unrelated (e.g. History vs CS)
    if base_score >= 90.0 and not field_relevant:
        return 60.0, False

    return base_score, field_relevant


# ── Strengths & Gaps ─────────────────────────────────────

def _build_strengths_gaps(
    skill_result: SkillMatchResult,
    exp_score: float,
    edu_score: float,
    relevant_months: int,
    total_months: int,
    field_relevant: bool,
    job: JobProfile,
) -> tuple[list[str], list[str]]:
    """Generate detailed human-readable strengths and gaps lists."""
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
    rel_years = round(relevant_months / 12, 1)
    tot_years = round(total_months / 12, 1)

    if exp_score >= 90:
        strengths.append(f"{rel_years} years of relevant experience meets the {req_years}+ year requirement")
    elif exp_score >= 60:
        gaps.append(f"{rel_years} years of relevant experience is slightly below the {req_years}+ year requirement")
    elif req_years > 0:
        gaps.append(f"Only {rel_years} years relevant experience ({tot_years} yrs total) vs {req_years}+ years required")

    if total_months > relevant_months and req_years > 0:
        gaps.append(f"Some past work ({tot_years - rel_years:.1f} yrs) is outside target domain")

    # Education
    if edu_score >= 100:
        strengths.append("Education degree and field meet or exceed requirements")
    elif not field_relevant and job.education_required:
        gaps.append(f"Degree level meets requirement, but major field does not match '{job.education_required}'")
    elif edu_score >= 60:
        strengths.append("Has relevant educational background")
    elif job.education_required:
        gaps.append(f"Education degree level does not meet requirement: {job.education_required}")

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
    """Compute deterministic match between resume and job with semantic skills,
    relevant experience, and education field matching."""
    skill_result = match_skills(resume, job)
    exp_score, relevant_months, total_months = match_experience(resume, job)
    edu_score, field_relevant = match_education(resume, job)

    final = (
        WEIGHTS["skill"] * skill_result.score
        + WEIGHTS["semantic"] * semantic_score
        + WEIGHTS["experience"] * exp_score
        + WEIGHTS["education"] * edu_score
    )

    strengths, gaps = _build_strengths_gaps(
        skill_result, exp_score, edu_score, relevant_months, total_months, field_relevant, job,
    )

    return MatchResult(
        skill_score=skill_result.score,
        semantic_score=semantic_score,
        experience_score=exp_score,
        education_score=edu_score,
        final_score=round(final, 1),
        skill_details=skill_result,
        relevant_experience_months=relevant_months,
        total_experience_months=total_months,
        strengths=strengths,
        gaps=gaps,
    )
