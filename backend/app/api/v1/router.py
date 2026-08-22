"""
API v1 router — /api/v1/*

Endpoints:
  POST   /jobs                    Create a job from JD text
  GET    /jobs                    List all jobs (paginated)
  GET    /jobs/{id}               Get job details
  POST   /jobs/{id}/screen        Upload resume(s) and screen against a job
  GET    /jobs/{id}/candidates    Ranked candidate list for a job (paginated)
  GET    /candidates/{id}         Full candidate screening detail
  GET    /health                  Health check
"""

import logging
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, UploadFile, File, Form, Query, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.auth import verify_api_key
from app.core.limiter import limiter
from app.models.job import Job
from app.models.match_result import MatchResultDB
from app.schemas.job import JobProfile
from app.schemas.match import ScreeningOutput
from app.services.parser import extract_text
from app.services.screener import screen_candidate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["screening"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


async def save_validated_upload(file: UploadFile) -> Path:
    """Validate file extension and size before saving with a sanitized UUID filename.

    Raises:
        HTTPException(400): If filename is missing, file is empty, or extension is unsupported.
        HTTPException(413): If file size exceeds settings.max_upload_size_mb.
    """
    if not file.filename:
        raise HTTPException(400, "Uploaded file must have a filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    content = bytearray()
    chunk_size = 1024 * 1024  # Read in 1MB chunks to prevent memory bloat

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > max_bytes:
            raise HTTPException(
                413,
                f"File '{file.filename}' exceeds maximum allowed size of {settings.max_upload_size_mb} MB."
            )

    if len(content) == 0:
        raise HTTPException(400, f"File '{file.filename}' is empty.")

    # Sanitized filename using UUID to prevent path traversal & name collisions
    safe_filename = f"{uuid4().hex}{ext}"
    saved_path = settings.upload_path / safe_filename
    saved_path.write_bytes(content)
    return saved_path


# ── Health ───────────────────────────────────────────────

@router.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.2.0"}


# ── Jobs ─────────────────────────────────────────────────

@router.post("/jobs", dependencies=[Depends(verify_api_key)])
@limiter.limit(settings.rate_limit_jobs)
async def create_job(
    request: Request,
    jd_text: str = Form(None, description="Paste job description text"),
    jd_file: UploadFile = File(None, description="Or upload a JD file (PDF/DOCX/TXT)"),
    db: Session = Depends(get_db),
):
    """Create a job from JD text or file. Extracts structured JobProfile via LLM."""
    from app.services.llm import extract_job_profile

    # Get JD text from form or file
    text = ""
    if jd_text and jd_text.strip():
        text = jd_text.strip()
    elif jd_file:
        file_path = await save_validated_upload(jd_file)
        try:
            text = extract_text(file_path)
        finally:
            file_path.unlink(missing_ok=True)

    if not text.strip():
        raise HTTPException(400, "Please provide job description text or upload a file.")

    try:
        profile = await extract_job_profile(text)
    except Exception as e:
        logger.exception("JD extraction failed")
        raise HTTPException(500, f"Failed to extract job profile: {str(e)}")

    job = Job(
        title=profile.job_title,
        description_text=text,
        profile_json=profile.model_dump(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return {
        "id": str(job.id),
        "title": job.title,
        "profile": profile.model_dump(),
        "created_at": job.created_at.isoformat(),
    }


@router.get("/jobs")
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
):
    """List all jobs (paginated)."""
    total = db.query(Job).count()
    rows = (
        db.query(Job)
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "jobs": [
            {
                "id": str(j.id),
                "title": j.title,
                "created_at": j.created_at.isoformat(),
                "candidate_count": db.query(MatchResultDB).filter(
                    MatchResultDB.job_id == j.id
                ).count(),
            }
            for j in rows
        ],
    }


@router.get("/jobs/{job_id}")
async def get_job(job_id: UUID, db: Session = Depends(get_db)):
    """Get job details with profile."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found.")
    return {
        "id": str(job.id),
        "title": job.title,
        "description_text": job.description_text,
        "profile": job.profile_json,
        "created_at": job.created_at.isoformat(),
    }


# ── Screening ───────────────────────────────────────────

@router.post("/jobs/{job_id}/screen", dependencies=[Depends(verify_api_key)])
@limiter.limit(settings.rate_limit_screen)
async def screen_resumes(
    request: Request,
    job_id: UUID,
    resumes: list[UploadFile] = File(..., description="One or more resume files"),
    db: Session = Depends(get_db),
):
    """Screen one or more resumes against a job. Returns ranked results."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found.")

    jd_text = job.description_text
    results = []
    errors = []

    for resume_file in resumes:
        filename = resume_file.filename or "unknown"
        try:
            file_path = await save_validated_upload(resume_file)
        except HTTPException as he:
            errors.append({"file": filename, "error": he.detail})
            continue
        except Exception as e:
            errors.append({"file": filename, "error": str(e)})
            continue

        try:
            resume_text = extract_text(file_path)
            if not resume_text.strip():
                errors.append({"file": filename, "error": "Could not extract text"})
                continue

            output: ScreeningOutput = await screen_candidate(resume_text, jd_text)

            # Persist
            match_db = MatchResultDB(
                job_id=job_id,
                candidate_name=output.candidate_name,
                candidate_email=output.candidate_email,
                candidate_phone=output.candidate_phone,
                resume_filename=filename,
                skill_score=output.match.skill_score,
                semantic_score=output.match.semantic_score,
                experience_score=output.match.experience_score,
                education_score=output.match.education_score,
                final_score=output.match.final_score,
                recommendation=output.reasoning.recommendation,
                resume_profile_json=output.model_dump(),
                reasoning_json=output.reasoning.model_dump(),
                match_details_json=output.match.model_dump(),
            )
            db.add(match_db)
            db.commit()
            db.refresh(match_db)

            results.append({
                "id": str(match_db.id),
                "candidate_name": output.candidate_name,
                "final_score": output.match.final_score,
                "recommendation": output.reasoning.recommendation,
                "resume_filename": filename,
            })

        except Exception as e:
            logger.exception(f"Screening failed for {filename}")
            errors.append({"file": filename, "error": str(e)})
        finally:
            file_path.unlink(missing_ok=True)

    # Sort by score descending
    results.sort(key=lambda r: r["final_score"], reverse=True)

    return {
        "job_id": str(job_id),
        "screened": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors,
    }


# ── Candidates ──────────────────────────────────────────

@router.get("/jobs/{job_id}/candidates")
async def list_candidates(
    job_id: UUID,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
):
    """Ranked candidate list for a job (paginated)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found.")

    total = (
        db.query(MatchResultDB)
        .filter(MatchResultDB.job_id == job_id)
        .count()
    )
    rows = (
        db.query(MatchResultDB)
        .filter(MatchResultDB.job_id == job_id)
        .order_by(MatchResultDB.final_score.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "job_id": str(job_id),
        "job_title": job.title,
        "total": total,
        "skip": skip,
        "limit": limit,
        "candidates": [
            {
                "id": str(r.id),
                "candidate_name": r.candidate_name,
                "resume_filename": r.resume_filename,
                "final_score": r.final_score,
                "skill_score": r.skill_score,
                "semantic_score": r.semantic_score,
                "experience_score": r.experience_score,
                "education_score": r.education_score,
                "recommendation": r.recommendation,
                "relevant_experience_months": r.match_details_json.get("relevant_experience_months", r.match_details_json.get("total_experience_months", 0)) if r.match_details_json else 0,
                "total_experience_months": r.match_details_json.get("total_experience_months", 0) if r.match_details_json else 0,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
    }


@router.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    """Full screening detail for one candidate."""
    row = db.query(MatchResultDB).filter(MatchResultDB.id == candidate_id).first()
    if not row:
        raise HTTPException(404, "Candidate screening not found.")

    return {
        "id": str(row.id),
        "job_id": str(row.job_id),
        "candidate_name": row.candidate_name,
        "candidate_email": row.candidate_email,
        "candidate_phone": row.candidate_phone,
        "resume_filename": row.resume_filename,
        "scores": {
            "skill_score": row.skill_score,
            "semantic_score": row.semantic_score,
            "experience_score": row.experience_score,
            "education_score": row.education_score,
            "final_score": row.final_score,
        },
        "recommendation": row.recommendation,
        "match_details": row.match_details_json,
        "reasoning": row.reasoning_json,
        "full_profile": row.resume_profile_json,
        "created_at": row.created_at.isoformat(),
    }
