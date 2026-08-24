"""
Deterministic Experience Calculator Service.

Convention:
  Elapsed calendar months calculation:
      duration_months = (end_year - start_year) * 12 + (end_month - start_month)

  Conservative year-only dates convention:
      When only a year is provided without a month (e.g. '2022' or '2024'), the system
      conservatively assumes January (month=1) for both start and end points.
      Examples:
        - '2022 - 2024'  -> Jan 2022 to Jan 2024 = 24 months.
        - '2022 - 2022'  -> Jan 2022 to Jan 2022 = 0 months.
        - 'June 2022 - 2024' -> June 2022 to Jan 2024 = 19 months.
        - '2022 - March 2024' -> Jan 2022 to March 2024 = 26 months.
        - '2023 - Present' -> Jan 2023 to current month.
"""

import re
from datetime import datetime
from typing import Optional, Tuple, Dict, Any

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


def parse_date_point_structured(date_str: Optional[str], is_end: bool = False) -> Optional[Dict[str, Any]]:
    """
    Parses a date point string (e.g. 'Jan 2022', '2022', '06/2021', '2022/01', 'Present')
    into a structured dict:
    {
       "year": int,
       "month": int or None,
       "has_month": bool,
       "is_present": bool
    }
    """
    if not date_str or not str(date_str).strip():
        return None

    cleaned = str(date_str).strip().lower()

    if any(p in cleaned for p in ["present", "current", "now", "till date", "ongoing"]):
        if is_end or not re.search(r"\b(19[7-9]\d|20[0-4]\d)\b", cleaned):
            now = datetime.now()
            return {"year": now.year, "month": now.month, "has_month": True, "is_present": True}

    years = re.findall(r"\b(19[7-9]\d|20[0-4]\d)\b", cleaned)
    if not years:
        return None
    year = int(years[-1] if is_end else years[0])

    has_month = False
    month = None

    # Check MM/YYYY, MM-YYYY, YYYY/MM, YYYY-MM
    slash_matches = re.findall(
        r"\b(?:(0?[1-9]|1[0-2])[\/\-](19[7-9]\d|20[0-4]\d)|(19[7-9]\d|20[0-4]\d)[\/\-](0?[1-9]|1[0-2]))\b",
        cleaned
    )
    if slash_matches:
        match_tuple = slash_matches[-1 if is_end else 0]
        if match_tuple[0] and match_tuple[1]:  # MM/YYYY
            month = int(match_tuple[0])
            year = int(match_tuple[1])
            has_month = True
        elif match_tuple[2] and match_tuple[3]:  # YYYY/MM
            year = int(match_tuple[2])
            month = int(match_tuple[3])
            has_month = True

    if not has_month:
        search_text = cleaned
        if is_end and ("-" in cleaned or "–" in cleaned or "—" in cleaned or "to" in cleaned):
            parts = re.split(r"\s*(?:–|—|-|to|until)\s*", cleaned)
            if len(parts) >= 2:
                search_text = parts[-1]

        for name, val in MONTH_MAP.items():
            if not name.isdigit() and re.search(r"\b" + name + r"\b", search_text):
                month = val
                has_month = True
                break

    return {
        "year": year,
        "month": month,
        "has_month": has_month,
        "is_present": False
    }


def parse_date_point(date_str: Optional[str], is_end: bool = False) -> Optional[Tuple[int, int]]:
    """Legacy helper returning (year, month). Month defaults to 1 for year-only dates."""
    res = parse_date_point_structured(date_str, is_end=is_end)
    if not res:
        return None
    m = res["month"] if res["has_month"] and res["month"] else 1
    return (res["year"], m)


def parse_date_range(raw_str: Optional[str]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], bool]:
    """Parse a full date range string e.g. 'Jan 2022 - Mar 2024' or '2021 - Present'.
    Returns (start_pt, end_pt, is_current)."""
    if not raw_str or not str(raw_str).strip():
        return None, None, False

    raw = str(raw_str).strip()
    is_current = any(p in raw.lower() for p in ["present", "current", "now", "till date", "ongoing"])

    parts = re.split(r"\s*(?:–|—|-|to|until)\s*", raw, flags=re.I)
    if len(parts) >= 2:
        start_pt = parse_date_point_structured(parts[0], is_end=False)
        end_pt = parse_date_point_structured(parts[1], is_end=True)
        return start_pt, end_pt, is_current
    elif len(parts) == 1:
        pt = parse_date_point_structured(parts[0], is_end=False)
        if pt:
            return pt, pt, is_current

    return None, None, is_current


def resolve_entry_interval(
    start_pt: Optional[Dict[str, Any]],
    end_pt: Optional[Dict[str, Any]],
    is_current: bool = False
) -> Tuple[Optional[Tuple[int, int]], int, str, str]:
    """
    Calculates elapsed calendar month duration:
        duration_months = (end_year - start_year) * 12 + (end_month - start_month)

    Year-only convention:
        Unspecified months default conservatively to January (month=1).
    """
    now = datetime.now()
    if is_current or (end_pt and end_pt.get("is_present")):
        end_pt = {"year": now.year, "month": now.month, "has_month": True, "is_present": True}
        is_current = True

    if not start_pt or not end_pt:
        return None, 0, "", ""

    # Effective start month (defaulting to January if year-only)
    start_m = start_pt["month"] if start_pt["has_month"] and start_pt["month"] else 1
    # Effective end month (defaulting to January if year-only)
    end_m = end_pt["month"] if end_pt["has_month"] and end_pt["month"] else 1

    s_idx = start_pt["year"] * 12 + start_m
    e_idx = end_pt["year"] * 12 + end_m

    if e_idx < s_idx:
        e_idx = s_idx

    duration = e_idx - s_idx

    # Format normalized dates without fabricating months if unprovided
    if start_pt["has_month"] and start_pt["month"]:
        s_fmt = f"{start_pt['year']}-{start_pt['month']:02d}"
    else:
        s_fmt = str(start_pt["year"])

    if is_current:
        e_fmt = "Present"
    elif end_pt["has_month"] and end_pt["month"]:
        e_fmt = f"{end_pt['year']}-{end_pt['month']:02d}"
    else:
        e_fmt = str(end_pt["year"])

    return (s_idx, e_idx), duration, s_fmt, e_fmt


def merge_month_intervals(intervals: list[Tuple[int, int]]) -> int:
    """Merge overlapping [start_month_index, end_month_index] intervals and return total elapsed calendar months."""
    if not intervals:
        return 0

    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []

    current_start, current_end = sorted_intervals[0]

    for next_start, next_end in sorted_intervals[1:]:
        if next_start <= current_end:  # Overlapping or contiguous
            current_end = max(current_end, next_end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = next_start, next_end

    merged.append((current_start, current_end))

    total_months = sum((end - start) for start, end in merged)
    return total_months


def is_internship_role(role: Optional[str], description: Optional[str] = None) -> bool:
    """Check if role or description indicates an internship/trainee position."""
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

    # 1. Parse structured points from start_str and end_str
    start_pt = parse_date_point_structured(start_str, is_end=False)
    end_pt = parse_date_point_structured(end_str, is_end=True)

    # 2. Fallback to raw_date_str
    if (not start_pt or not end_pt) and raw_str:
        raw_start, raw_end, raw_curr = parse_date_range(raw_str)
        if not start_pt:
            start_pt = raw_start
        if not end_pt:
            end_pt = raw_end
        is_curr = is_curr or raw_curr

    # 3. Fallback to role/description text
    if not start_pt or not end_pt:
        combined_text = f"{start_str or ''} {end_str or ''} {raw_str or ''} {role} {desc}"
        raw_start, raw_end, raw_curr = parse_date_range(combined_text)
        if not start_pt:
            start_pt = raw_start
        if not end_pt:
            end_pt = raw_end
        is_curr = is_curr or raw_curr

    if start_pt and end_pt:
        interval, duration, start_fmt, end_fmt = resolve_entry_interval(start_pt, end_pt, is_current=is_curr)
        return max(0, duration), start_fmt, end_fmt, is_curr, is_intern

    existing_duration = getattr(exp_entry, "duration_months", None)
    if existing_duration and existing_duration > 0:
        return existing_duration, start_str, end_str, is_curr, is_intern

    return 0, start_str, end_str, is_curr, is_intern


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

        exp.duration_months = duration
        exp.is_current = is_curr
        exp.is_internship = is_intern
        if start_fmt:
            exp.start_date = start_fmt
        if end_fmt:
            exp.end_date = end_fmt

        start_pt = parse_date_point_structured(exp.start_date, is_end=False)
        end_pt = parse_date_point_structured(exp.end_date, is_end=True)

        if start_pt and end_pt:
            interval, entry_dur, _, _ = resolve_entry_interval(start_pt, end_pt, is_current=is_curr)
            if interval and entry_dur > 0:
                total_intervals.append(interval)

                if is_intern:
                    intern_intervals.append(interval)
                else:
                    prof_intervals.append(interval)

                role = getattr(exp, "role", "") or ""
                desc = getattr(exp, "description", "") or ""
                text = f"{role} {desc}".lower()

                is_rel = True
                if job_keywords:
                    is_rel = any(kw in text for kw in job_keywords) if text.strip() else True

                if is_rel:
                    relevant_intervals.append(interval)

    total_months = merge_month_intervals(total_intervals)
    relevant_months = merge_month_intervals(relevant_intervals)
    professional_months = merge_month_intervals(prof_intervals)
    internship_months = merge_month_intervals(intern_intervals)

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
        "total_experience_months": max(0, total_months),
        "relevant_experience_months": max(0, relevant_months),
        "professional_experience_months": max(0, professional_months),
        "internship_experience_months": max(0, internship_months),
    }
