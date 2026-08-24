"""
Pydantic schemas for structured resume extraction (Task 2).

These models represent the extracted resume profile independently
of any job description — no matching, scoring, or recommendations.
"""

from typing import Optional

from pydantic import BaseModel, Field


class Education(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None


class Experience(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    is_internship: bool = False
    raw_date_str: Optional[str] = None
    duration_months: Optional[int] = None
    description: Optional[str] = None


class Project(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: list[str] = Field(default_factory=list)


class Certification(BaseModel):
    name: Optional[str] = None
    issuing_organization: Optional[str] = None
    year: Optional[int] = None


class ResumeProfile(BaseModel):
    """Top-level structured resume extracted by the LLM."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: list[str] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    projects: list[Project] = Field(default_factory=list)
    certifications: list[Certification] = Field(default_factory=list)
