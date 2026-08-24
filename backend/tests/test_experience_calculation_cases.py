"""
Unit tests for experience calculation pipeline verification (Section 10 Requirements).
"""

import pytest
from datetime import datetime
from app.schemas.resume import Experience, ResumeProfile
from app.services.experience_calculator import (
    parse_date_point_structured,
    parse_date_range,
    resolve_entry_interval,
    resolve_experience_dates_and_duration,
    compute_resume_experience_metrics,
)


def test_case_1_jan_2022_to_mar_2024():
    """TEST 1: Jan 2022 - Mar 2024 -> ~27 months."""
    exp = Experience(role="Software Engineer", raw_date_str="Jan 2022 - Mar 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 27
    assert start_fmt == "2022-01"
    assert end_fmt == "2024-03"
    assert is_curr is False


def test_case_2_june_2023_to_february_2024():
    """TEST 2: June 2023 - February 2024 -> ~9 months (NOT 20 months)."""
    exp = Experience(role="Analyst", raw_date_str="June 2023 - February 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 9
    assert start_fmt == "2023-06"
    assert end_fmt == "2024-02"


def test_case_3_year_only_2022_to_2024():
    """TEST 3: 2022 - 2024 -> 24 months (conservative, avoids 36-month overestimation)."""
    exp = Experience(role="Developer", raw_date_str="2022 - 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 24
    assert start_fmt == "2022"
    assert end_fmt == "2024"


def test_case_4_june_2022_to_present():
    """TEST 4: June 2022 - Present -> calculated relative to current date."""
    exp = Experience(role="Senior Engineer", raw_date_str="June 2022 - Present")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    now = datetime.now()
    expected_dur = (now.year * 12 + now.month) - (2022 * 12 + 6) + 1
    assert dur == expected_dur
    assert is_curr is True
    assert end_fmt == "Present"


def test_case_5_overlapping_employment():
    """TEST 5: Jan 2022 - Dec 2023 & Jan 2023 - Present -> overlapping period counted once in total."""
    exp1 = Experience(company="Company A", role="Engineer", raw_date_str="Jan 2022 - Dec 2023")
    exp2 = Experience(company="Company B", role="Lead", raw_date_str="Jan 2023 - Present")

    metrics = compute_resume_experience_metrics([exp1, exp2])
    now = datetime.now()
    expected_total = (now.year * 12 + now.month) - (2022 * 12 + 1) + 1
    assert metrics["total_experience_months"] == expected_total


def test_case_6_internship_vs_professional():
    """TEST 6: Internship June 2023 - Aug 2023 & Professional Sep 2023 - Present."""
    exp1 = Experience(company="Inc", role="Software Engineering Intern", raw_date_str="June 2023 - August 2023")
    exp2 = Experience(company="Corp", role="Software Engineer", raw_date_str="September 2023 - Present")

    metrics = compute_resume_experience_metrics([exp1, exp2])
    assert metrics["internship_experience_months"] == 3
    now = datetime.now()
    expected_prof = (now.year * 12 + now.month) - (2023 * 12 + 9) + 1
    assert metrics["professional_experience_months"] == expected_prof


def test_various_date_formats_and_separators():
    """Verify flexible date separators and slash/dash formats."""
    # Slash formats
    exp_slash = Experience(role="Dev", raw_date_str="01/2022 - 03/2024")
    dur_s, _, _, _, _ = resolve_experience_dates_and_duration(exp_slash)
    assert dur_s == 27

    # YYYY/MM formats
    exp_iso = Experience(role="Dev", raw_date_str="2022/01 to 2024/03")
    dur_iso, _, _, _, _ = resolve_experience_dates_and_duration(exp_iso)
    assert dur_iso == 27

    # En-dash and Em-dash
    exp_dash = Experience(role="Dev", raw_date_str="Jan 2022 – Mar 2024")
    dur_d, _, _, _, _ = resolve_experience_dates_and_duration(exp_dash)
    assert dur_d == 27
