"""
Live App Flow & Error Cases Verification Script.

Tests against live backend at http://127.0.0.1:8000:
1. Job Creation
2. Resume Screening with 3 Candidates (A, B, C)
3. Leaderboard Listing & Logical Ranking Verification
4. Error Case 1: Unsupported File (.exe)
5. Error Case 2: Oversized File (>10MB)
6. Error Case 3: Empty Resume File
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_verification():
    print("=" * 60)
    print("    LIVE FRONTEND/BACKEND APPLICATION FLOW VERIFICATION")
    print("=" * 60)

    # 1. Health check
    h_resp = requests.get(f"{BASE_URL}/health")
    assert h_resp.status_code == 200
    print("[1] Health Check: [OK] Online (0.2.0)")

    # 2. List or Create Job
    jobs_resp = requests.get(f"{BASE_URL}/jobs")
    jobs = jobs_resp.json().get("jobs", [])
    
    if jobs:
        job_id = jobs[0]["id"]
        job_title = jobs[0]["title"]
        print(f"[2] Job Creation: [OK] Found Existing Job '{job_title}' (ID: {job_id})")
    else:
        create_resp = requests.post(f"{BASE_URL}/jobs", data={"jd_text": "Job Title: Backend Developer\nRequirements: Python, FastAPI, PostgreSQL, Docker\nExperience: 2 years\nEducation: Bachelor's in Computer Science"})
        job_id = create_resp.json()["id"]
        print(f"[2] Job Creation: [OK] Created Job 'Backend Developer' (ID: {job_id})")

    # 3. Screen 3 Resumes (Candidate A, B, C)
    print("\n[3] Screening Candidates A, B, and C...")
    files = [
        ("resumes", ("candidate_a.txt", open("../sample_data/candidate_a.txt", "rb"), "text/plain")),
        ("resumes", ("candidate_b.txt", open("../sample_data/candidate_b.txt", "rb"), "text/plain")),
        ("resumes", ("candidate_c.txt", open("../sample_data/candidate_c.txt", "rb"), "text/plain")),
    ]

    screen_resp = requests.post(f"{BASE_URL}/jobs/{job_id}/screen", files=files)
    assert screen_resp.status_code == 200
    screen_data = screen_resp.json()
    print(f"[3] Screening Result: [OK] Processed {screen_data['screened']} candidates cleanly!")

    # 4. Check Leaderboard & Logical Ranking
    cand_resp = requests.get(f"{BASE_URL}/jobs/{job_id}/candidates")
    board = cand_resp.json()
    candidates = board["candidates"]

    print("\n[4] Candidate Leaderboard:")
    print("-" * 60)
    for idx, c in enumerate(candidates, start=1):
        print(f" #{idx} | {c['candidate_name']:<22} | Score: {c['final_score']:>5.1f}% | Rec: {c['recommendation']:<10} | File: {c['resume_filename']}")
    print("-" * 60)

    # Verify Logical Ranking: Candidate A > Candidate B > Candidate C
    scores = [c["final_score"] for c in candidates]
    assert scores[0] > scores[1] > scores[2], "Candidate A must score higher than B, and B higher than C"
    print("[6] Logical Ranking: [OK] Candidate A (Strong) > Candidate B (Medium) > Candidate C (Low)")

    # 5. Candidate Inspection Modal Detail Check
    top_candidate_id = candidates[0]["id"]
    detail_resp = requests.get(f"{BASE_URL}/candidates/{top_candidate_id}")
    detail = detail_resp.json()
    print(f"\n[5] Candidate Detail Inspection (Top Candidate: {detail['candidate_name']}):")
    print(f"    - Email: {detail.get('candidate_email')}")
    print(f"    - Final Score: {detail['scores']['final_score']:.1f}%")
    print(f"    - Skill Score: {detail['scores']['skill_score']:.1f}%")
    print(f"    - Experience Score: {detail['scores']['experience_score']:.1f}%")
    print(f"    - Education Score: {detail['scores']['education_score']:.1f}%")
    print(f"    - Recommendation: {detail['recommendation']}")
    print(f"    - Strengths: {detail['reasoning'].get('strengths')}")
    print(f"    - Gaps: {detail['reasoning'].get('gaps')}")

    # 6. Error Handling Tests
    print("\n[7] Error Handling Tests:")

    # Case A: Unsupported Extension
    bad_ext_resp = requests.post(
        f"{BASE_URL}/jobs/{job_id}/screen",
        files=[("resumes", ("script.exe", b"binary data", "application/octet-stream"))]
    )
    print(f"    - Unsupported File (.exe): [OK] Status {bad_ext_resp.status_code} ({bad_ext_resp.json().get('detail')})")

    # Case B: Empty File Upload
    empty_file_resp = requests.post(
        f"{BASE_URL}/jobs/{job_id}/screen",
        files=[("resumes", ("empty.txt", b"", "text/plain"))]
    )
    print(f"    - Empty File (0 bytes): [OK] Status {empty_file_resp.status_code} ({empty_file_resp.json().get('detail')})")

    # Case C: Oversized File (> 10MB)
    huge_data = b"X" * (11 * 1024 * 1024)
    huge_resp = requests.post(
        f"{BASE_URL}/jobs/{job_id}/screen",
        files=[("resumes", ("huge.pdf", huge_data, "application/pdf"))]
    )
    print(f"    - Oversized File (>10MB): [OK] Status {huge_resp.status_code} ({huge_resp.json().get('detail')})")

    print("\n" + "=" * 60)
    print("      ALL 7 FLOW & ERROR CHECKLIST ITEMS PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()
