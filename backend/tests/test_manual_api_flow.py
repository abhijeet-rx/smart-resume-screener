"""
Manual API Flow & E2E Verification Test.

Tests:
1. GET /api/v1/health
2. POST /api/v1/jobs (Backend Developer JD)
3. POST /api/v1/jobs/{id}/screen with 4 candidate resumes:
   - Candidate A (Ideal Match): 4 yrs experience, Python, FastAPI, PostgreSQL, Docker, AWS, B.S. CS
   - Candidate B (Good Match): 2 yrs experience, Python, FastAPI, PostgreSQL, B.S. IT
   - Candidate C (Partial Match): 1 yr experience, Python, B.A. History
   - Candidate D (Poor Match): 6 mo Web Design, HTML/CSS/JS, Diploma
4. GET /api/v1/jobs/{id}/candidates -> verifies score ranking order (Candidate A > B > C > D)
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core import database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# ── Sample Data ──────────────────────────────────────────

BACKEND_JD_TEXT = """
Job Title: Senior Backend Developer
Location: Remote
Type: Full-time

Requirements:
- 2+ years of professional experience building web applications
- Strong proficiency in Python, FastAPI, and PostgreSQL
- Experience designing RESTful APIs
- Bachelor's degree in Computer Science or related STEM field

Nice to Have:
- Docker, Kubernetes
- AWS (EC2, S3, RDS)
"""

RESUME_A_TEXT = """
Candidate A — Ideal Senior Backend Engineer
email: candidate.a@example.com | (555) 111-2222
Skills: Python, FastAPI, PostgreSQL, Docker, AWS, REST APIs, Git
Education: B.S. Computer Science — Tech University, 2020
Experience:
Senior Software Engineer at DevCorp (48 months)
- Built high-throughput REST APIs using FastAPI and PostgreSQL.
- Deployed microservices on AWS using Docker.
"""

RESUME_B_TEXT = """
Candidate B — Good Backend Developer
email: candidate.b@example.com | (555) 333-4444
Skills: Python, FastAPI, PostgreSQL, REST APIs
Education: B.S. Information Technology — State College, 2022
Experience:
Backend Engineer at WebStudio (24 months)
- Developed Python REST APIs with PostgreSQL database.
"""

RESUME_C_TEXT = """
Candidate C — Partial Match / Junior Dev
email: candidate.c@example.com | (555) 555-6666
Skills: Python, HTML, CSS, Git
Education: B.A. History — Liberal Arts College, 2021
Experience:
Junior Developer at SmallBiz (12 months)
- Wrote basic Python scripts and maintained website.
"""

RESUME_D_TEXT = """
Candidate D — Poor Match / Non-technical
email: candidate.d@example.com | (555) 777-8888
Skills: HTML, CSS, JavaScript, WordPress
Education: Diploma in Web Design — Online Academy
Experience:
Freelance Web Designer (6 months)
- Designed WordPress websites.
"""

# Mock LLM Extractions for 4 Candidates
_MOCK_JOB_PROFILE = {
    "job_title": "Backend Developer",
    "required_skills": ["Python", "FastAPI", "PostgreSQL"],
    "preferred_skills": ["Docker", "AWS"],
    "experience_required": 2,
    "education_required": "Bachelor's degree in Computer Science",
    "responsibilities": ["Build REST APIs", "Manage databases"],
}

_MOCK_PROFILE_A = {
    "name": "Candidate A (Ideal)",
    "email": "candidate.a@example.com",
    "phone": "(555) 111-2222",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "REST APIs"],
    "education": [{"degree": "B.S.", "field": "Computer Science", "institution": "Tech University", "graduation_year": 2020}],
    "experience": [{"company": "DevCorp", "role": "Senior Software Engineer", "duration_months": 48, "description": "Built FastAPI REST APIs with PostgreSQL on AWS"}],
    "projects": [], "certifications": [],
}

_MOCK_PROFILE_B = {
    "name": "Candidate B (Good)",
    "email": "candidate.b@example.com",
    "phone": "(555) 333-4444",
    "skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs"],
    "education": [{"degree": "B.S.", "field": "Information Technology", "institution": "State College", "graduation_year": 2022}],
    "experience": [{"company": "WebStudio", "role": "Backend Engineer", "duration_months": 24, "description": "Developed Python REST APIs with PostgreSQL"}],
    "projects": [], "certifications": [],
}

_MOCK_PROFILE_C = {
    "name": "Candidate C (Partial)",
    "email": "candidate.c@example.com",
    "phone": "(555) 555-6666",
    "skills": ["Python", "HTML", "CSS"],
    "education": [{"degree": "B.A.", "field": "History", "institution": "Liberal Arts College", "graduation_year": 2021}],
    "experience": [{"company": "SmallBiz", "role": "Junior Developer", "duration_months": 12, "description": "Wrote basic Python scripts"}],
    "projects": [], "certifications": [],
}

_MOCK_PROFILE_D = {
    "name": "Candidate D (Poor)",
    "email": "candidate.d@example.com",
    "phone": "(555) 777-8888",
    "skills": ["HTML", "CSS", "JavaScript", "WordPress"],
    "education": [{"degree": "Diploma", "field": "Web Design", "institution": "Online Academy"}],
    "experience": [{"company": "Freelance", "role": "Web Designer", "duration_months": 6, "description": "Designed WordPress sites"}],
    "projects": [], "certifications": [],
}


@pytest.fixture
def client_with_db(monkeypatch):
    """Setup SQLite in-memory DB for end-to-end API testing."""
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    test_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", test_session_factory)

    import app.models.job  # noqa: F401
    import app.models.match_result  # noqa: F401
    database.Base.metadata.create_all(bind=test_engine)

    from app.core.database import get_db

    def _override_get_db():
        db = test_session_factory()
        try:
            yield db
        finally:
            db.close()
    from app.main import app as fastapi_app
    fastapi_app.dependency_overrides[get_db] = _override_get_db
    client = TestClient(fastapi_app)
    yield client
    fastapi_app.dependency_overrides.clear()


class TestManualAPIFlow:
    def test_e2e_job_creation_screening_ranking(self, client_with_db):
        """End-to-end testing of GET /health, POST /jobs, POST /jobs/{id}/screen, and GET /jobs/{id}/candidates."""

        # 1. GET /health
        health_resp = client_with_db.get("/api/v1/health")
        assert health_resp.status_code == 200
        assert health_resp.json()["status"] == "ok"
        print("\n[OK] Step 1: GET /health -> 200 OK")

        # 2. POST /jobs with mock LLM for JD profile extraction
        with patch("app.services.llm._call_openai", new_callable=AsyncMock) as mock_llm, \
             patch("app.services.llm.settings") as mock_settings:
            mock_settings.llm_provider = "openai"
            mock_llm.return_value = _MOCK_JOB_PROFILE

            job_resp = client_with_db.post("/api/v1/jobs", data={"jd_text": BACKEND_JD_TEXT})
            assert job_resp.status_code == 200
            job_data = job_resp.json()
            job_id = job_data["id"]
            assert job_data["title"] == "Backend Developer"
            print(f"[OK] Step 2: POST /jobs -> Job Created ID: {job_id}")

        # 3. Screen 4 Candidates sequentially
        candidates_data = [
            ("resume_a.txt", RESUME_A_TEXT, _MOCK_PROFILE_A, {"semantic_score": 92, "recommendation": "SHORTLIST", "reasoning": "Ideal backend candidate", "strengths": ["All required skills", "AWS/Docker exp"], "gaps": []}),
            ("resume_b.txt", RESUME_B_TEXT, _MOCK_PROFILE_B, {"semantic_score": 80, "recommendation": "GOOD_MATCH", "reasoning": "Solid backend candidate", "strengths": ["FastAPI and PostgreSQL exp"], "gaps": ["No AWS/Docker"]}),
            ("resume_c.txt", RESUME_C_TEXT, _MOCK_PROFILE_C, {"semantic_score": 45, "recommendation": "REVIEW", "reasoning": "Junior candidate with gap in skills and experience", "strengths": ["Basic Python"], "gaps": ["Missing FastAPI, PostgreSQL", "History major"]}),
            ("resume_d.txt", RESUME_D_TEXT, _MOCK_PROFILE_D, {"semantic_score": 15, "recommendation": "REJECT", "reasoning": "Web designer with no backend experience", "strengths": [], "gaps": ["Missing all required backend skills", "No backend experience"]}),
        ]

        screened_results = []
        for filename, content, mock_profile, mock_reasoning in candidates_data:
            with patch("app.services.llm._call_openai", new_callable=AsyncMock) as mock_llm, \
                 patch("app.services.llm.settings") as mock_settings:
                mock_settings.llm_provider = "openai"
                # Return profile extraction followed by semantic reasoning
                mock_llm.side_effect = [mock_profile, _MOCK_JOB_PROFILE, mock_reasoning]

                screen_resp = client_with_db.post(
                    f"/api/v1/jobs/{job_id}/screen",
                    files={"resumes": (filename, content.encode("utf-8"), "text/plain")}
                )
                assert screen_resp.status_code == 200
                res_json = screen_resp.json()
                assert res_json["screened"] == 1
                screened_results.append(res_json["results"][0])

        print(f"[OK] Step 3: Screened 4 candidates successfully.")

        # 4. GET /jobs/{job_id}/candidates (Check Leaderboard & Order)
        list_resp = client_with_db.get(f"/api/v1/jobs/{job_id}/candidates")
        assert list_resp.status_code == 200
        board = list_resp.json()
        assert board["total"] == 4

        ranked = board["candidates"]

        print("\n" + "=" * 60)
        print("          ACTUAL API CANDIDATE LEADERBOARD RANKING")
        print("=" * 60)
        for idx, c in enumerate(ranked, start=1):
            print(f" #{idx} | {c['candidate_name']:<22} | Score: {c['final_score']:>5.1f}% | Rec: {c['recommendation']:<10} | File: {c['resume_filename']}")
        print("=" * 60)

        # Assert logical ordering: Candidate A > Candidate B > Candidate C > Candidate D
        scores = [c["final_score"] for c in ranked]
        assert scores[0] > scores[1] > scores[2] > scores[3], "Candidates must be strictly sorted by score descending"
        assert "Candidate A" in ranked[0]["candidate_name"]
        assert "Candidate B" in ranked[1]["candidate_name"]
        assert "Candidate C" in ranked[2]["candidate_name"]
        assert "Candidate D" in ranked[3]["candidate_name"]
        print("[OK] Step 4: Confirmed candidate score ordering makes total sense! (Candidate A > B > C > D)")


if __name__ == "__main__":
    pytest.main(["-s", __file__])
