"""
Deterministic Experience Calculator Service.

Provides:
  - parse_date_string()           — parses flexible date strings into (year, month)
  - merge_intervals()             — merges overlapping (start, end) month intervals
  - calculate_experience()        — computes total, relevant, professional, and internship months
"""

import re
from datetime import datetime
from typing import Optional, Tuple

MONTH_MAP = {
    "jan": 1, "january": 1, "01": 1, "1": 1,
    "feb": 2, "february": 2, "02": 2, "2": 2,
    "mar": 3, "march": 3, "03": 3, "3": 3,
    "apr": 4, "april": 4, "04": 4, "4": 4,
    "may": 5, "05": 5, "5": 5,
    "jun": 6, "june": 6, "06": 6, "6": 6,
    "jul": 7, "july": 7, "07": 7, "7": 7,
    "aug": 8, "august": 8, "08": 8, "8": 8,
    "sep": 9, "september": 9, "sept": 9, "09": 9, "9": 9,
    "oct": 10, "october": 10, "10": 10,
    "nov": 11, "november": 11, "11": 11,
    "dec": 12, "december": 12, "12": 12,
}

INTERNSHIP_KEYWORDS = {
    "intern", "internship", "trainee", "student intern", "co-op", "coop", "summer intern", "apprentice"
}


def parse_date_point(date_str: Optional[str], is_end: bool = False) -> Optional[Tuple[int, int]]:
    """Parse a single date point (e.g. 'Jan 2022', '2022', '06/2021', 'Present') into (year, month)."""
    if not date_str or not str(date_str).strip():
        return None

    cleaned = str(date_str).strip().lower()

    # Check present/current
    if any(p in cleaned for p in ["present", "current", "now", "till date", "ongoing"]):
        if is_end or not re.search(r"\b(19[7-9]\d|20[0-4]\d)\b", cleaned):
            now = datetime.now()
            return (now.year, now.month)

    # Search for year (1970 - 2099)
    years = re.findall(r"\b(19[7-9]\d|20[0-4]\d)\b", cleaned)
    if not years:
        return None
    year = int(years[-1] if is_end else years[0])

    # Search for month
    month = 1 if not is_end else 12

    # Try MM/YYYY or MM-YYYY or YYYY-MM or YYYY/MM
    slash_matches = re.findall(r"\b(?:(0?[1-9]|1[0-2])[\/\-](19[7-9]\d|20[0-4]\d)|(19[7-9]\d|20[0-4]\d)[\/\-](0?[1-9]|1[0-2]))\b", cleaned)
    if slash_matches:
        match_tuple = slash_matches[-1 if is_end else 0]
        if match_tuple[0] and match_tuple[1]:  # MM/YYYY
            month = int(match_tuple[0])
            year = int(match_tuple[1])
            return (year, month)
        elif match_tuple[2] and match_tuple[3]:  # YYYY/MM
            year = int(match_tuple[2])
            month = int(match_tuple[3])
            return (year, month)

    # Try text month e.g. "Jan", "January"
    search_text = cleaned
    if is_end and ("-" in cleaned or "–" in cleaned or "—" in cleaned or "to" in cleaned):
        parts = re.split(r"\s*(?:–|—|-|to|until)\s*", cleaned)
        if len(parts) >= 2:
            search_text = parts[-1]

    for name, val in MONTH_MAP.items():
        if not name.isdigit() and re.search(r"\b" + name + r"\b", search_text):
            month = val
            break

    return (year, month)


def parse_date_range(raw_str: Optional[str]) -> Tuple[Optional[Tuple[int, int]], Optional[Tuple[int, int]], bool]:
    """Parse a full date range string e.g. 'Jan 2022 - Mar 2024' or '2021 - Present'.
    Returns (start_ym, end_ym, is_current)."""
    if not raw_str or not str(raw_str).strip():
        return None, None, False

    raw = str(raw_str).strip()
    is_current = any(p in raw.lower() for p in ["present", "current", "now", "till date", "ongoing"])

    # Split by separator (-, –, —, to, until)
    parts = re.split(r"\s*(?:–|—|-|to|until)\s*", raw, flags=re.I)
    if len(parts) >= 2:
        start_pt = parse_date_point(parts[0], is_end=False)
        end_pt = parse_date_point(parts[1], is_end=True)
        return start_pt, end_pt, is_current
    elif len(parts) == 1:
        pt = parse_date_point(parts[0], is_end=False)
        if pt:
            return pt, pt, is_current

    return None, None, is_current


def to_month_index(ym: Tuple[int, int]) -> int:
    """Convert (year, month) tuple into absolute month index."""
    return ym[0] * 12 + ym[1]


def calculate_months_between(start_ym: Tuple[int, int], end_ym: Tuple[int, int]) -> int:
    """Calculate duration in months between start and end (inclusive, min 1)."""
    start_idx = to_month_index(start_ym)
    end_idx = to_month_index(end_ym)
    if end_idx < start_idx:
        return 1
    return (end_idx - start_idx) + 1


def merge_month_intervals(intervals: list[Tuple[int, int]]) -> int:
    """Merge overlapping [start_month_index, end_month_index] intervals and return non-overlapping total months."""
    if not intervals:
        return 0

    # Sort by start index
    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []

    current_start, current_end = sorted_intervals[0]

    for next_start, next_end in sorted_intervals[1:]:
        if next_start <= current_end + 1:  # Overlapping or adjacent
            current_end = max(current_end, next_end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = next_start, next_end

    merged.append((current_start, current_end))

    # Sum total non-overlapping months
    total_months = sum((end - start + 1) for start, end in merged)
    return total_months


def is_internship_role(role: Optional[str], description: Optional[str] = None) -> bool:
    """Check if the role or description indicates an internship/trainee position."""
    text = f"{role or ''} {description or ''}".lower()
    return any(kw in text for kw in INTERNSHIP_KEYWORDS)


def resolve_experience_dates_and_duration(
    exp_entry,
) -> Tuple[Optional[int], Optional[str], Optional[str], bool, bool]:
    """Extract start_date, end_date, is_current, is_internship, and duration_months for a single Experience entry.
    Returns (duration_months, start_date_str, end_date_str, is_current, is_internship)."""
    role = getattr(exp_entry, "role", None) or ""
    desc = getattr(exp_entry, "description", None) or ""
    start_str = getattr(exp_entry, "start_date", None)
    end_str = getattr(exp_entry, "end_date", None)
    raw_str = getattr(exp_entry, "raw_date_str", None)
    is_curr = getattr(exp_entry, "is_current", False) or False
    is_intern = getattr(exp_entry, "is_internship", False) or is_internship_role(role, desc)

    # Try parsing start_str & end_str first
    start_ym = parse_date_point(start_str, is_end=False)
    end_ym = parse_date_point(end_str, is_end=True)

    # Fallback to parsing raw_date_str if start or end missing
    if (not start_ym or not end_ym) and raw_str:
        raw_start, raw_end, raw_curr = parse_date_range(raw_str)
        if not start_ym:
            start_ym = raw_start
        if not end_ym:
            end_ym = raw_end
        is_curr = is_curr or raw_curr

    # Fallback: scan description or role text for date ranges if still missing
    if not start_ym or not end_ym:
        combined_text = f"{start_str or ''} {end_str or ''} {raw_str or ''} {role} {desc}"
        raw_start, raw_end, raw_curr = parse_date_range(combined_text)
        if not start_ym:
            start_ym = raw_start
        if not end_ym:
            end_ym = raw_end
        is_curr = is_curr or raw_curr

    if is_curr:
        now = datetime.now()
        end_ym = (now.year, now.month)

    if start_ym and end_ym:
        duration = calculate_months_between(start_ym, end_ym)
        start_fmt = f"{start_ym[0]}-{start_ym[1]:02d}"
        end_fmt = f"{end_ym[0]}-{end_ym[1]:02d}" if not is_curr else "Present"
        return duration, start_fmt, end_fmt, is_curr, is_intern

    # If duration_months was directly provided and valid, keep it
    existing_duration = getattr(exp_entry, "duration_months", None)
    if existing_duration and existing_duration > 0:
        return existing_duration, start_str, end_str, is_curr, is_intern

    return None, start_str, end_str, is_curr, is_intern


def compute_resume_experience_metrics(
    experience_list: list,
    job_keywords: Optional[set[str]] = None,
) -> dict:
    """Compute total_months, relevant_months, professional_months, internship_months with interval merging."""
    total_intervals = []
    relevant_intervals = []
    prof_intervals = []
    intern_intervals = []

    for exp in experience_list:
        duration, start_fmt, end_fmt, is_curr, is_intern = resolve_experience_dates_and_duration(exp)
        
        # Attach computed values back to entry object
        exp.duration_months = duration
        exp.is_current = is_curr
        exp.is_internship = is_intern
        if start_fmt:
            exp.start_date = start_fmt
        if end_fmt:
            exp.end_date = end_fmt

        # Parse start and end ym for interval merging
        start_ym = parse_date_point(exp.start_date, is_end=False)
        end_ym = parse_date_point(exp.end_date, is_end=True)

        if start_ym and end_ym:
            start_idx = to_month_index(start_ym)
            end_idx = to_month_index(end_ym)
            interval = (start_idx, max(start_idx, end_idx))

            total_intervals.append(interval)

            if is_intern:
                intern_intervals.append(interval)
            else:
                prof_intervals.append(interval)

            # Check relevance
            role = getattr(exp, "role", "") or ""
            desc = getattr(exp, "description", "") or ""
            text = f"{role} {desc}".lower()

            is_rel = True
            if job_keywords:
                is_rel = any(kw in text for kw in job_keywords) if text.strip() else True

            if is_rel:
                relevant_intervals.append(interval)

    # Compute non-overlapping merged months
    total_months = merge_month_intervals(total_intervals)
    relevant_months = merge_month_intervals(relevant_intervals)
    professional_months = merge_month_intervals(prof_intervals)
    internship_months = merge_month_intervals(intern_intervals)

    # Fallback if no dates were parseable but duration_months was given
    if total_months == 0 and experience_list:
        sum_total = sum(getattr(e, "duration_months", 0) or 0 for e in experience_list)
        sum_prof = sum(
            getattr(e, "duration_months", 0) or 0
            for e in experience_list
            if not getattr(e, "is_internship", False)
        )
        sum_intern = sum(
            getattr(e, "duration_months", 0) or 0
            for e in experience_list
            if getattr(e, "is_internship", False)
        )
        sum_rel = 0
        for exp in experience_list:
            dur = getattr(exp, "duration_months", 0) or 0
            role = getattr(exp, "role", "") or ""
            desc = getattr(exp, "description", "") or ""
            text = f"{role} {desc}".lower()
            if not job_keywords or any(kw in text for kw in job_keywords):
                sum_rel += dur

        total_months = sum_total
        professional_months = sum_prof
        internship_months = sum_intern
        relevant_months = sum_rel if sum_rel > 0 else (sum_total if not job_keywords else 0)

    return {
        "total_experience_months": total_months,
        "relevant_experience_months": relevant_months,
        "professional_experience_months": professional_months,
        "internship_experience_months": internship_months,
    }
