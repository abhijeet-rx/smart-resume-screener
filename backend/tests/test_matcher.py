"""
Tests for Task 4: Deterministic matching engine.

All tests are pure unit tests — no LLM, no DB, no network calls.
"""

import pytest

from app.schemas.resume import ResumeProfile, Education, Experience, Certification
from app.schemas.job import JobProfile
from app.services.matcher import (
    _normalize_skill,
    match_skills,
    match_experience,
    match_education,
    compute_match,
)


# ── Fixtures ─────────────────────────────────────────────

@pytest.fixture
def strong_candidate() -> ResumeProfile:
    return ResumeProfile(
        name="Jane Doe",
        email="jane@example.com",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis", "GraphQL"],
        education=[Education(degree="B.S.", field="Computer Science", institution="State University", graduation_year=2017)],
        experience=[
            Experience(company="TechStart", role="Senior Engineer", duration_months=36, description="Built APIs"),
            Experience(company="DataFlow", role="Engineer", duration_months=28, description="ETL pipelines"),
        ],
        certifications=[Certification(name="AWS SAA", issuing_organization="Amazon", year=2022)],
    )


@pytest.fixture
def weak_candidate() -> ResumeProfile:
    return ResumeProfile(
        name="Bob Newbie",
        skills=["HTML", "CSS", "JavaScript"],
        education=[Education(degree="Diploma", field="Web Design", institution="Online School")],
        experience=[
            Experience(company="Freelance", role="Web Designer", duration_months=6),
        ],
    )


@pytest.fixture
def backend_job() -> JobProfile:
    return JobProfile(
        job_title="Senior Backend Engineer",
        required_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
        preferred_skills=["Redis", "Kafka", "GraphQL"],
        experience_required=5,
        education_required="Bachelor's degree in Computer Science",
        responsibilities=["Design APIs", "Scale services"],
    )


# ── Skill normalization ─────────────────────────────────

class TestSkillNormalization:
    def test_basic_alias(self):
        assert _normalize_skill("JS") == "javascript"
        assert _normalize_skill("Postgres") == "postgresql"
        assert _normalize_skill("K8s") == "kubernetes"
        assert _normalize_skill("golang") == "go"

    def test_case_insensitive(self):
        assert _normalize_skill("PYTHON") == "python"
        assert _normalize_skill("Docker") == "docker"

    def test_unknown_skill_passthrough(self):
        assert _normalize_skill("TensorFlow") == "tensorflow"
        assert _normalize_skill("Some Niche Tool") == "some niche tool"


# ── Skill matching ───────────────────────────────────────

class TestSkillMatching:
    def test_strong_match(self, strong_candidate, backend_job):
        result = match_skills(strong_candidate, backend_job)
        assert len(result.matched_required) == 5  # all 5 required
        assert len(result.missing_required) == 0
        assert len(result.matched_preferred) >= 2  # Redis, GraphQL
        assert result.score >= 90

    def test_weak_match(self, weak_candidate, backend_job):
        result = match_skills(weak_candidate, backend_job)
        assert len(result.matched_required) == 0
        assert len(result.missing_required) == 5
        assert result.score < 30

    def test_empty_job_skills(self, strong_candidate):
        job = JobProfile(job_title="Any Role")
        result = match_skills(strong_candidate, job)
        # No requirements → full marks
        assert result.score == 100.0

    def test_alias_matching(self):
        """JS in resume should match JavaScript in JD."""
        resume = ResumeProfile(skills=["JS", "Node", "Postgres"])
        job = JobProfile(required_skills=["JavaScript", "Node.js", "PostgreSQL"])
        result = match_skills(resume, job)
        assert len(result.matched_required) == 3
        assert len(result.missing_required) == 0


# ── Experience matching ──────────────────────────────────

class TestExperienceMatching:
    def test_exceeds_requirement(self, strong_candidate, backend_job):
        score, months = match_experience(strong_candidate, backend_job)
        assert months == 64  # 36 + 28
        assert score >= 90

    def test_below_requirement(self, weak_candidate, backend_job):
        score, months = match_experience(weak_candidate, backend_job)
        assert months == 6
        assert score < 30

    def test_no_requirement(self, strong_candidate):
        job = JobProfile(job_title="Any Role")
        score, _ = match_experience(strong_candidate, job)
        assert score == 100.0

    def test_no_experience_data(self, backend_job):
        resume = ResumeProfile(name="Empty")
        score, months = match_experience(resume, backend_job)
        assert months == 0
        assert score < 10


# ── Education matching ───────────────────────────────────

class TestEducationMatching:
    def test_meets_requirement(self, strong_candidate, backend_job):
        score = match_education(strong_candidate, backend_job)
        assert score == 100.0

    def test_below_requirement(self, weak_candidate, backend_job):
        score = match_education(weak_candidate, backend_job)
        assert score < 100  # Diploma < Bachelor's

    def test_no_requirement(self, strong_candidate):
        job = JobProfile(job_title="Any Role")
        score = match_education(strong_candidate, job)
        assert score == 100.0

    def test_masters_exceeds_bachelors(self, backend_job):
        resume = ResumeProfile(
            education=[Education(degree="M.S.", field="Computer Science")]
        )
        score = match_education(resume, backend_job)
        assert score == 100.0


# ── Full match computation ───────────────────────────────

class TestComputeMatch:
    def test_strong_candidate(self, strong_candidate, backend_job):
        result = compute_match(strong_candidate, backend_job, semantic_score=85)
        assert result.final_score > 70
        assert result.skill_score >= 90
        assert len(result.strengths) > 0

    def test_weak_candidate(self, weak_candidate, backend_job):
        result = compute_match(weak_candidate, backend_job, semantic_score=20)
        assert result.final_score < 40
        assert len(result.gaps) > 0

    def test_score_weights_add_up(self, strong_candidate, backend_job):
        """Verify the weighted formula produces a reasonable range."""
        result = compute_match(strong_candidate, backend_job, semantic_score=0)
        # Without semantic score (30% weight = 0), max is 70
        assert result.final_score <= 70 + 1  # small rounding tolerance

    def test_has_strengths_and_gaps(self, strong_candidate, backend_job):
        result = compute_match(strong_candidate, backend_job, semantic_score=80)
        # Strong candidate should have strengths
        assert any("required skill" in s.lower() for s in result.strengths)
