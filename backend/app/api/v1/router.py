"""
API v1 router — /api/v1/*
"""

import logging
from uuid import UUID

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.screening import Screening
from app.schemas.screening import (
    ScreeningResponse,
    ScreeningListItem,
    ScreeningResult,
    HealthResponse,
)
from app.services.parser import extract_text
from app.services.llm import screen_resume

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["screening"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse()


@router.post("/screen", response_model=ScreeningResponse)
async def screen(
    resume: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    jd: UploadFile = File(..., description="Job description file (PDF, DOCX, or TXT)"),
    db: Session = Depends(get_db),
):
    """Upload a resume + job description and receive structured screening JSON."""
    # Save uploaded files
    upload_dir = settings.upload_path

    resume_path = upload_dir / resume.filename
    jd_path = upload_dir / jd.filename

    resume_bytes = await resume.read()
    jd_bytes = await jd.read()

    resume_path.write_bytes(resume_bytes)
    jd_path.write_bytes(jd_bytes)

    try:
        # Extract text
        resume_text = extract_text(resume_path)
        jd_text = extract_text(jd_path)

        if not resume_text.strip():
            raise HTTPException(400, "Could not extract text from resume file.")
        if not jd_text.strip():
            raise HTTPException(400, "Could not extract text from job description file.")

        # Call LLM
        result_dict = await screen_resume(resume_text, jd_text)
        result = ScreeningResult(**result_dict)

        # Persist to DB
        screening = Screening(
            candidate_name=result.candidate.name,
            candidate_email=result.candidate.email,
            resume_filename=resume.filename,
            jd_filename=jd.filename,
            match_score=result.match_score,
            recommendation=result.recommendation,
            result_json=result_dict,
            resume_text=resume_text,
            jd_text=jd_text,
        )
        db.add(screening)
        db.commit()
        db.refresh(screening)

        return ScreeningResponse(
            id=screening.id,
            resume_filename=screening.resume_filename,
            jd_filename=screening.jd_filename,
            result=result,
            created_at=screening.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Screening failed")
        raise HTTPException(500, f"Screening failed: {str(e)}")
    finally:
        # Clean up uploaded files
        resume_path.unlink(missing_ok=True)
        jd_path.unlink(missing_ok=True)


@router.get("/screenings", response_model=list[ScreeningListItem])
async def list_screenings(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """List past screening results."""
    rows = (
        db.query(Screening)
        .order_by(Screening.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        ScreeningListItem(
            id=r.id,
            candidate_name=r.candidate_name,
            resume_filename=r.resume_filename,
            match_score=r.match_score,
            recommendation=r.recommendation,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/screenings/{screening_id}", response_model=ScreeningResponse)
async def get_screening(screening_id: UUID, db: Session = Depends(get_db)):
    """Get a specific screening result by ID."""
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(404, "Screening not found.")

    result = ScreeningResult(**screening.result_json)
    return ScreeningResponse(
        id=screening.id,
        resume_filename=screening.resume_filename,
        jd_filename=screening.jd_filename,
        result=result,
        created_at=screening.created_at,
    )
