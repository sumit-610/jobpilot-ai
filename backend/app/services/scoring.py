from typing import Tuple

ROLE_GROUPS = {
    "founder's office": [
        "founder's office",
        "founder associate",
        "chief of staff",
        "strategy",
        "special projects",
        "business operations",
        "operations associate",
    ],
    "product": [
        "product manager",
        "product management",
        "product",
        "associate product manager",
        "apm",
        "product operations",
        "growth product",
    ],
    "operations": [
        "operations",
        "business operations",
        "operations manager",
        "ops",
        "logistics",
        "supply chain",
    ],
    "data": [
        "data analyst",
        "business intelligence",
        "analytics",
        "data science",
        "data engineer",
        "sql",
        "power bi",
        "tableau",
    ],
    "machine learning": [
        "machine learning",
        "ml engineer",
        "ai engineer",
        "deep learning",
        "computer vision",
        "nlp",
        "llm",
        "genai",
        "artificial intelligence",
    ],
    "software": [
        "software engineer",
        "backend",
        "frontend",
        "full stack",
        "fullstack",
        "web developer",
        "mobile developer",
        "react",
        "next.js",
        "python",
        "java",
        "golang",
    ],
    "finance": [
        "investment banking",
        "equity research",
        "fp&a",
        "financial analyst",
        "corporate finance",
    ],
    "consulting": [
        "consultant",
        "strategy",
        "management consulting",
        "business consulting",
    ],
    "marketing": [
        "growth",
        "digital marketing",
        "performance marketing",
        "brand",
        "seo",
    ],
    "sales": [
        "business development",
        "account executive",
        "sales",
        "customer success",
        "partnerships",
    ],
}


def calculate_match_score(
    preferences: dict,
    resume: dict,
    job,
) -> Tuple[int, str, list[str]]:

    score = 0
    reasons = []

    role = (preferences.get("role") or "").lower().strip()
    title = (job.title or "").lower().strip()
    description = (job.raw_description or "").lower()
    job_text = f"{title} {description}"

    # ---------------- ROLE ----------------

    if role:

        matched = False

        if role in ROLE_GROUPS:

            for alias in ROLE_GROUPS[role]:

                if alias in job_text:
                    score += 50
                    reasons.append(f"Strong {role} match")
                    matched = True
                    break

        if not matched:

            overlap = len(
                set(role.split()) &
                set(title.split())
            )

            if overlap >= 2:
                score += 50
                reasons.append("Strong role match")

            elif overlap == 1:
                score += 25
                reasons.append("Partial role match")

    # ---------------- LOCATION ----------------

    pref_location = (
        preferences.get("location") or ""
    ).lower().strip()

    job_location = (
        job.location or ""
    ).lower().strip()

    if (
        pref_location
        and pref_location in job_location
    ):
        score += 20
        reasons.append("Location match")

    # ---------------- WORK MODE ----------------

    pref_mode = (
        preferences.get("work_mode") or ""
    ).lower().strip()

    job_mode = (
        job.work_mode or ""
    ).lower().strip()

    if (
        pref_mode
        and pref_mode == job_mode
    ):
        score += 10
        reasons.append("Preferred work mode")

    # ---------------- KEYWORDS ----------------

    matched_keywords = []

    for keyword in (
        preferences.get("keywords", "")
        .lower()
        .split(",")
    ):

        keyword = keyword.strip()

        if keyword and keyword in job_text:
            matched_keywords.append(keyword)

    if matched_keywords:

        keyword_score = min(
            len(matched_keywords) * 10,
            30,
        )

        score += keyword_score

        reasons.append(
            "Matched keywords: "
            + ", ".join(matched_keywords)
        )

    # ---------------- RESUME SKILLS ----------------

    matched_resume_skills = []

    for skill in resume.get("skills", []):

        skill = skill.lower().strip()

        if skill and skill in job_text:
            matched_resume_skills.append(skill)

    if matched_resume_skills:

        resume_score = min(
            len(matched_resume_skills) * 5,
            30,
        )

        score += resume_score

        reasons.append(
            "Resume skills: "
            + ", ".join(
                matched_resume_skills[:5]
            )
        )

    return (
        min(score, 100),
        ", ".join(reasons),
        matched_resume_skills,
    )