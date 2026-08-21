"""
Tests for Task 2: Resume → Structured JSON extraction.

Tests the full pipeline:
  sample_resume.txt → extract_text() → extract_resume_profile() → ResumeProfile

Requires a valid LLM API key in the environment (OPENAI_API_KEY or GEMINI_API_KEY)
and the corresponding LLM_PROVIDER setting.
"""

import asyncio
from pathlib import Path

import pytest

from app.services.parser import extract_text
from app.services.llm import extract_resume_profile
from app.schemas.resume import ResumeProfile

# ── Paths ────────────────────────────────────────────────

SAMPLE_RESUME = Path(__file__).resolve().parent.parent.parent / "sample_data" / "sample_resume.txt"


# ── Unit tests (no LLM needed) ───────────────────────────

class TestResumeSchema:
    """Validate that ResumeProfile handles partial / empty data correctly."""

    def test_minimal_valid_profile(self):
        """A profile with only a name and nothing else should be valid."""
        profile = ResumeProfile(name="Jane")
        assert profile.name == "Jane"
        assert profile.email is None
        assert profile.skills == []
        assert profile.education == []
        assert profile.experience == []
        assert profile.projects == []
        assert profile.certifications == []

    def test_completely_empty_profile(self):
        """A profile with all nulls/empty should still validate."""
        profile = ResumeProfile()
        assert profile.name is None
        assert profile.skills == []

    def test_full_profile_from_dict(self):
        """Validate a realistic LLM-like dict parses correctly."""
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234",
            "skills": ["Python", "Docker"],
            "education": [
                {
                    "degree": "B.S.",
                    "field": "Computer Science",
                    "institution": "MIT",
                    "graduation_year": 2020,
                }
            ],
            "experience": [
                {
                    "company": "Acme",
                    "role": "Engineer",
                    "duration_months": 24,
                    "description": "Built things.",
                }
            ],
            "projects": [
                {
                    "name": "Side project",
                    "description": "A cool app",
                    "technologies": ["React"],
                }
            ],
            "certifications": [
                {
                    "name": "AWS SAA",
                    "issuing_organization": "Amazon",
                    "year": 2022,
                }
            ],
        }
        profile = ResumeProfile.model_validate(data)
        assert profile.name == "John Doe"
        assert len(profile.skills) == 2
        assert profile.education[0].graduation_year == 2020
        assert profile.experience[0].duration_months == 24
        assert profile.certifications[0].year == 2022

    def test_null_optional_fields_are_accepted(self):
        """LLM may return explicit nulls for missing data — must not fail."""
        data = {
            "name": "Jane",
            "email": None,
            "phone": None,
            "skills": [],
            "education": [{"degree": None, "field": None, "institution": None, "graduation_year": None}],
            "experience": [],
            "projects": [],
            "certifications": [],
        }
        profile = ResumeProfile.model_validate(data)
        assert profile.name == "Jane"
        assert profile.education[0].degree is None


class TestTextExtraction:
    """Verify the parser can extract text from the sample resume."""

    def test_sample_resume_exists(self):
        assert SAMPLE_RESUME.exists(), f"Sample resume not found at {SAMPLE_RESUME}"

    def test_extract_text_from_sample(self):
        text = extract_text(SAMPLE_RESUME)
        assert len(text) > 100, "Extracted text is suspiciously short"
        assert "JANE DOE" in text
        assert "Python" in text


# ── Integration test (requires LLM API key) ─────────────

class TestResumeExtraction:
    """End-to-end extraction test — calls the real LLM.

    Skip this test if no API key is configured by setting:
        pytest -m "not integration"
    """

    @pytest.mark.integration
    def test_extract_resume_profile_from_sample(self):
        """Full pipeline: sample file → text → LLM → ResumeProfile."""
        resume_text = extract_text(SAMPLE_RESUME)
        assert resume_text.strip(), "Resume text is empty"

        # Run the async function
        profile = asyncio.run(extract_resume_profile(resume_text))

        # ── Type check ───────────────────────────────────
        assert isinstance(profile, ResumeProfile)

        # ── Contact info ─────────────────────────────────
        assert profile.name is not None, "Name should be extracted"
        assert "doe" in profile.name.lower(), f"Expected 'Doe' in name, got: {profile.name}"

        # ── Skills ───────────────────────────────────────
        assert len(profile.skills) >= 5, f"Expected at least 5 skills, got {len(profile.skills)}"
        skills_lower = [s.lower() for s in profile.skills]
        assert "python" in skills_lower, f"Python should be in skills: {profile.skills}"

        # ── Education ────────────────────────────────────
        assert len(profile.education) >= 1, "Should have at least 1 education entry"
        assert profile.education[0].graduation_year == 2017

        # ── Experience ───────────────────────────────────
        assert len(profile.experience) >= 2, f"Expected at least 2 experience entries, got {len(profile.experience)}"

        # ── Certifications ───────────────────────────────
        assert len(profile.certifications) >= 1, "Should have at least 1 certification"

        # ── Print the result for manual inspection ───────
        print("\n" + "=" * 60)
        print("EXTRACTED RESUME PROFILE")
        print("=" * 60)
        print(profile.model_dump_json(indent=2))

    @pytest.mark.integration
    def test_empty_resume_raises(self):
        """Passing empty text should raise ValueError."""
        with pytest.raises(ValueError, match="resume text is empty"):
            asyncio.run(extract_resume_profile(""))

        with pytest.raises(ValueError, match="resume text is empty"):
            asyncio.run(extract_resume_profile("   \n  "))
