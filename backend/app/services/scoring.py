from typing import Tuple


def calculate_match_score(
    preferences: dict,
    job,
) -> Tuple[int, str]:

    score = 0
    reasons = []

    # ROLE MATCH (50)
    role = (preferences.get("role") or "").lower().strip()
    title = (job.title or "").lower().strip()

    role_words = set(role.split())
    title_words = set(title.split())

    overlap = len(role_words & title_words)

    if overlap >= 2:
        score += 50
        reasons.append("Strong role match")
    elif overlap == 1:
        score += 25
        reasons.append("Partial role match")

    # LOCATION MATCH (20)
    pref_location = (preferences.get("location") or "").lower().strip()
    job_location = (job.location or "").lower().strip()

    if pref_location and pref_location in job_location:
        score += 20
        reasons.append("Location match")

    # WORK MODE MATCH (10)
    pref_mode = (preferences.get("work_mode") or "").lower().strip()
    job_mode = (job.work_mode or "").lower().strip()

    if pref_mode and pref_mode == job_mode:
        score += 10
        reasons.append("Preferred work mode")

    # KEYWORD MATCH (20)
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