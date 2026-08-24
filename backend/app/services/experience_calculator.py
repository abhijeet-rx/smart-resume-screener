"""
Deterministic Experience Calculator Service.

Provides:
  - parse_date_point_structured() — parses flexible date strings into structured year/month representations
  - parse_date_range()             — parses full range strings into structured start/end points
  - merge_month_intervals()        — merges overlapping (start_month_index, end_month_index) intervals
  - resolve_experience_dates_and_duration() — computes duration and normalized dates for single entry
  - compute_resume_experience_metrics()     — computes total, relevant, professional, and internship months
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

    # Check for Present / Current / Ongoing
    if any(p in cleaned for p in ["present", "current", "now", "till date", "ongoing"]):
        if is_end or not re.search(r"\b(19[7-9]\d|20[0-4]\d)\b", cleaned):
            now = datetime.now()
            return {"year": now.year, "month": now.month, "has_month": True, "is_present": True}

    # Extract 4-digit years (1970-2049)
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
    """Legacy helper returning (year, month). Month defaults to 1 for start, 12 for end if unparsed."""
    res = parse_date_point_structured(date_str, is_end=is_end)
    if not res:
        return None
    m = res["month"] if res["has_month"] and res["month"] else (12 if is_end else 1)
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
    Calculates deterministic month duration and interval bounds:
    Returns ( (start_month_idx, end_month_idx), duration_months, start_fmt, end_fmt )
    """
    now = datetime.now()
    if is_current or (end_pt and end_pt.get("is_present")):
        end_pt = {"year": now.year, "month": now.month, "has_month": True, "is_present": True}
        is_current = True

    if not start_pt or not end_pt:
        return None, 0, "", ""

    # Case 1: Both start & end have explicit month
    if start_pt["has_month"] and end_pt["has_month"]:
        sy, sm = start_pt["year"], start_pt["month"]
        ey, em = end_pt["year"], end_pt["month"]
        s_idx = sy * 12 + sm
        e_idx = ey * 12 + em
        if e_idx < s_idx:
            e_idx = s_idx
        duration = (e_idx - s_idx) + 1
        s_fmt = f"{sy}-{sm:02d}"
        e_fmt = "Present" if is_current else f"{ey}-{em:02d}"
        return (s_idx, e_idx), duration, s_fmt, e_fmt

    # Case 2: Both start & end are year-only (e.g. 2022 - 2024 or 2023 - 2023)
    if not start_pt["has_month"] and not end_pt["has_month"]:
        sy = start_pt["year"]
        ey = end_pt["year"]
        if ey < sy:
            ey = sy
        years_diff = ey - sy
        duration = max(1, years_diff) * 12  # 2022-2024 = 24 months, 2023-2023 = 12 months
        s_idx = sy * 12 + 1
        e_idx = s_idx + duration - 1
        s_fmt = f"{sy}"
        e_fmt = "Present" if is_current else f"{ey}"
        return (s_idx, e_idx), duration, s_fmt, e_fmt

    # Case 3: Start has month, End is year-only (e.g. June 2023 - 2024)
    if start_pt["has_month"] and not end_pt["has_month"]:
        sy, sm = start_pt["year"], start_pt["month"]
        ey = end_pt["year"]
        if ey < sy:
            ey = sy
        em = sm if ey > sy else 12
        s_idx = sy * 12 + sm
        e_idx = ey * 12 + em
        if e_idx < s_idx:
            e_idx = s_idx
        duration = (e_idx - s_idx) + 1
        s_fmt = f"{sy}-{sm:02d}"
        e_fmt = "Present" if is_current else f"{ey}"
        return (s_idx, e_idx), duration, s_fmt, e_fmt

    # Case 4: Start is year-only, End has month (e.g. 2022 - March 2024)
    if not start_pt["has_month"] and end_pt["has_month"]:
        sy = start_pt["year"]
        ey, em = end_pt["year"], end_pt["month"]
        if ey < sy:
            sy = ey
        sm = em if ey > sy else 1
        s_idx = sy * 12 + sm
        e_idx = ey * 12 + em
        if e_idx < s_idx:
            e_idx = s_idx
        duration = (e_idx - s_idx) + 1
        s_fmt = f"{sy}"
        e_fmt = "Present" if is_current else f"{ey}-{em:02d}"
        return (s_idx, e_idx), duration, s_fmt, e_fmt

    return None, 0, "", ""


def merge_month_intervals(intervals: list[Tuple[int, int]]) -> int:
    """Merge overlapping [start_month_index, end_month_index] intervals and return total calendar months."""
    if not intervals:
        return 0

    sorted_intervals = sorted(intervals, key=lambda x: x[0])
    merged = []

    current_start, current_end = sorted_intervals[0]

    for next_start, next_end in sorted_intervals[1:]:
        if next_start <= current_end + 1:  # Overlapping or contiguous
            current_end = max(current_end, next_end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = next_start, next_end

    merged.append((current_start, current_end))

    total_months = sum((end - start + 1) for start, end in merged)
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
        if duration > 0:
            return duration, start_fmt, end_fmt, is_curr, is_intern

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

        exp.duration_months = duration
        exp.is_current = is_curr
        exp.is_internship = is_intern
        if start_fmt:
            exp.start_date = start_fmt
        if end_fmt:
            exp.end_date = end_fmt

        # Parse structured points for interval calculation
        start_pt = parse_date_point_structured(exp.start_date, is_end=False)
        end_pt = parse_date_point_structured(exp.end_date, is_end=True)

        if start_pt and end_pt:
            interval, entry_dur, _, _ = resolve_entry_interval(start_pt, end_pt, is_current=is_curr)
            if interval:
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
        "total_experience_months": total_months,
        "relevant_experience_months": relevant_months,
        "professional_experience_months": professional_months,
        "internship_experience_months": internship_months,
    }
