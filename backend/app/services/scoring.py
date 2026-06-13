from typing import Tuple


def calculate_match_score(
    preferences: dict,
    job,
) -> Tuple[int, str]:

    score = 0
    reasons = []

    role = (preferences.get("role") or "").lower()
    title = (job.title or "").lower()

    if role and role in title:
        score += 50
        reasons.append("Strong role match")

    pref_location = (preferences.get("location") or "").lower()
    job_location = (job.location or "").lower()

    if pref_location and pref_location in job_location:
        score += 20
        reasons.append("Location match")

    pref_mode = (preferences.get("work_mode") or "").lower()
    job_mode = (job.work_mode or "").lower()

    if pref_mode and pref_mode == job_mode:
        score += 10
        reasons.append("Preferred work mode")

    keywords = (
        preferences.get("keywords", "")
        .lower()
        .split(",")
    )

    matched = []

    for keyword in keywords:
        keyword = keyword.strip()

        if keyword and keyword in title:
            matched.append(keyword)

    if matched:
        score += 20
        reasons.append(
            f"Matched keywords: {', '.join(matched)}"
        )

    return min(score, 100), ", ".join(reasons)