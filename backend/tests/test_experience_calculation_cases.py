"""
Unit tests for experience calculation pipeline verification (Section 9 Requirements).
"""

import pytest
from datetime import datetime
from app.schemas.resume import Experience
from app.services.experience_calculator import (
    resolve_experience_dates_and_duration,
    compute_resume_experience_metrics,
)


def test_1_jan_2022_to_mar_2024():
    """TEST 1: Jan 2022 - Mar 2024 -> 26 months."""
    exp = Experience(role="Software Engineer", raw_date_str="Jan 2022 - Mar 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 26
    assert start_fmt == "2022-01"
    assert end_fmt == "2024-03"


def test_2_june_2023_to_february_2024():
    """TEST 2: June 2023 - February 2024 -> 8 months."""
    exp = Experience(role="Analyst", raw_date_str="June 2023 - February 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 8
    assert start_fmt == "2023-06"
    assert end_fmt == "2024-02"


def test_3_year_only_2022_to_2024():
    """TEST 3: 2022 - 2024 -> 24 months (conservative convention)."""
    exp = Experience(role="Developer", raw_date_str="2022 - 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 24
    assert start_fmt == "2022"
    assert end_fmt == "2024"


def test_4_year_only_2022_to_2022():
    """TEST 4: 2022 - 2022 -> 0 months."""
    exp = Experience(role="Consultant", raw_date_str="2022 - 2022")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 0
    assert start_fmt == "2022"
    assert end_fmt == "2022"


def test_5_june_2022_to_2024():
    """TEST 5: June 2022 - 2024 -> 19 months (June 2022 -> January 2024)."""
    exp = Experience(role="Engineer", raw_date_str="June 2022 - 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 19
    assert start_fmt == "2022-06"
    assert end_fmt == "2024"


def test_6_2022_to_march_2024():
    """TEST 6: 2022 - March 2024 -> 26 months (January 2022 -> March 2024)."""
    exp = Experience(role="Specialist", raw_date_str="2022 - March 2024")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 26
    assert start_fmt == "2022"
    assert end_fmt == "2024-03"


def test_7_june_2022_to_present():
    """TEST 7: June 2022 - Present -> elapsed months to current date."""
    exp = Experience(role="Senior Engineer", raw_date_str="June 2022 - Present")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    now = datetime.now()
    expected_dur = (now.year * 12 + now.month) - (2022 * 12 + 6)
    assert dur == expected_dur
    assert is_curr is True
    assert end_fmt == "Present"


def test_8_overlapping_employment():
    """TEST 8: Jan 2022 - Dec 2023 & Jan 2023 - Present -> overlapping months counted only once."""
    exp1 = Experience(company="Company A", role="Engineer", raw_date_str="Jan 2022 - Dec 2023")
    exp2 = Experience(company="Company B", role="Lead", raw_date_str="Jan 2023 - Present")

    metrics = compute_resume_experience_metrics([exp1, exp2])
    now = datetime.now()
    expected_total = (now.year * 12 + now.month) - (2022 * 12 + 1)
    assert metrics["total_experience_months"] == expected_total


def test_9_june_2023_to_august_2023():
    """TEST 9: June 2023 - August 2023 -> 2 months."""
    exp = Experience(role="Intern", raw_date_str="June 2023 - August 2023")
    dur, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
    assert dur == 2
    assert start_fmt == "2023-06"
    assert end_fmt == "2023-08"
    assert is_intern is True


def test_10_invalid_date_strings():
    """TEST 10: Invalid date strings -> no crash, no negative duration, safe fallback."""
    exp1 = Experience(role="Worker", raw_date_str="Unknown Date Range")
    dur1, start_fmt1, end_fmt1, is_curr1, _ = resolve_experience_dates_and_duration(exp1)
    assert dur1 == 0

    exp2 = Experience(role="Worker", raw_date_str="2025 - 2021")  # Reversed dates
    dur2, _, _, _, _ = resolve_experience_dates_and_duration(exp2)
    assert dur2 >= 0
