"""
Verification Dataset Tests for Matcher Engine.

Test 1: ML Semantic Matching (PyTorch + TensorFlow → Machine Learning)
Test 2: Relevant Experience Filtering (3 yrs Marketing + 2 yrs Backend → 2 yrs relevant)
Test 3: Education Field Penalty (B.Tech Computer Science vs B.A. History)
Test 4: Alias & Semantic Skill Recognition (ReactJS + Next.js → React)
"""

import pytest
from app.schemas.resume import ResumeProfile, Education, Experience
from app.schemas.job import JobProfile
from app.services.matcher import compute_match, match_skills, match_experience, match_education


class TestVerificationDataset:
    def test_case_1_ml_semantic_relationship(self):
        """Test 1: Candidate with PyTorch + TensorFlow applying for Machine Learning Engineer."""
        job = JobProfile(
            job_title="Machine Learning Engineer",
            required_skills=["Machine Learning", "Python"],
            experience_required=2,
        )
        resume = ResumeProfile(
            name="Alice ML",
            skills=["PyTorch", "TensorFlow", "Python"],
            experience=[Experience(company="AI Lab", role="ML Research Engineer", duration_months=24, description="Built deep learning models with PyTorch")],
        )

        match = compute_match(resume, job, semantic_score=0)
        skill_res = match.skill_details

        print("\n--- TEST 1: ML Semantic Relationship ---")
        print(f"Skill Score: {match.skill_score}")
        print(f"Matched Required Skills: {skill_res.matched_required}")
        print(f"Missing Required Skills: {skill_res.missing_required}")

        assert len(skill_res.missing_required) == 0
        assert any("Machine Learning" in s for s in skill_res.matched_required)
        assert match.skill_score >= 90.0

    def test_case_2_relevant_experience_filtering(self):
        """Test 2: Candidate with 3 yrs Marketing + 2 yrs Backend applying for Backend Dev (2 yrs req)."""
        job = JobProfile(
            job_title="Backend Developer",
            required_skills=["Python", "FastAPI", "PostgreSQL"],
            experience_required=2,  # 24 months
        )
        resume = ResumeProfile(
            name="Bob Switcher",
            skills=["Python", "FastAPI", "PostgreSQL"],
            experience=[
                Experience(company="AdAgency", role="Marketing Manager", duration_months=36, description="Social media & marketing campaigns"),
                Experience(company="DevStudio", role="Backend Engineer", duration_months=24, description="Built REST APIs with Python & FastAPI"),
            ],
        )

        match = compute_match(resume, job, semantic_score=0)
        _, rel_months, tot_months = match_experience(resume, job)

        print("\n--- TEST 2: Relevant Experience Filtering ---")
        print(f"Total Experience Months: {tot_months} (5.0 years)")
        print(f"Relevant Experience Months: {rel_months} (2.0 years)")
        print(f"Experience Score: {match.experience_score}")
        print(f"Gaps: {match.gaps}")

        assert tot_months == 60
        assert rel_months == 24  # Only 2 years Backend, not 5 years total
        assert match.experience_score == 90.0  # Exactly meets 2 years requirement

    def test_case_3_education_field_penalty(self):
        """Test 3: Candidate with B.A. History applying for B.Tech Computer Science requirement."""
        job = JobProfile(
            job_title="Software Engineer",
            education_required="B.Tech in Computer Science",
        )
        resume_history = ResumeProfile(
            name="Charlie History",
            education=[Education(degree="B.A.", field="History", institution="State University")],
        )
        resume_cs = ResumeProfile(
            name="Dave CS",
            education=[Education(degree="B.Tech", field="Computer Science", institution="Tech Institute")],
        )

        match_history = compute_match(resume_history, job, semantic_score=0)
        match_cs = compute_match(resume_cs, job, semantic_score=0)

        print("\n--- TEST 3: Education Field Relevance ---")
        print(f"B.Tech CS Candidate Score: {match_cs.education_score}")
        print(f"B.A. History Candidate Score: {match_history.education_score}")
        print(f"History Candidate Gaps: {match_history.gaps}")

        assert match_cs.education_score == 100.0
        assert match_history.education_score == 60.0  # Field mismatch penalty
        assert any("field" in gap.lower() for gap in match_history.gaps)

    def test_case_4_react_alias_and_semantic_recognition(self):
        """Test 4: Candidate with ReactJS + Next.js applying for React Developer."""
        job = JobProfile(
            job_title="React Developer",
            required_skills=["React"],
        )
        resume = ResumeProfile(
            name="Eve Frontend",
            skills=["ReactJS", "Next.js"],
        )

        match = compute_match(resume, job, semantic_score=0)
        skill_res = match.skill_details

        print("\n--- TEST 4: React Alias & Next.js Recognition ---")
        print(f"Skill Score: {match.skill_score}")
        print(f"Matched Required Skills: {skill_res.matched_required}")
        print(f"Missing Required Skills: {skill_res.missing_required}")

        assert len(skill_res.missing_required) == 0
        assert "React" in skill_res.matched_required
        assert match.skill_score == 100.0


def run_verification_report():
    """CLI helper to run all 4 verification tests and print formatted report."""
    tester = TestVerificationDataset()
    print("=" * 60)
    print("      SMART RESUME SCREENER — MATCHER VERIFICATION REPORT")
    print("=" * 60)

    tester.test_case_1_ml_semantic_relationship()
    tester.test_case_2_relevant_experience_filtering()
    tester.test_case_3_education_field_penalty()
    tester.test_case_4_react_alias_and_semantic_recognition()

    print("\n" + "=" * 60)
    print("   ALL 4 VERIFICATION TEST CASES PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_verification_report()
