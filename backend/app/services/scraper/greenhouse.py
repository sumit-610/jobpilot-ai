# """
# Greenhouse scraper — uses Greenhouse's public board API.
#
# No auth, no Playwright. Each company exposes:
#   GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
#
# The ?content=true param includes the full job description in the response,
# saving a second request per job.
#
# Usage:
#     from app.services.scraper.greenhouse import GreenhouseScraper
#     saved = await GreenhouseScraper().run()
# """

import app.models
import hashlib
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

import httpx
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.job import Job
from app.services.scraper.base import RawJob

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Companies to scrape. Add any Greenhouse customer slug here.
# Slug = the subdomain used on their jobs board, e.g. boards.greenhouse.io/stripe
# ---------------------------------------------------------------------------
COMPANIES: list[dict[str, str]] = [
    {"slug": "stripe",    "name": "Stripe"},
    {"slug": "notion",    "name": "Notion"},
    {"slug": "figma",     "name": "Figma"},
    {"slug": "ramp",      "name": "Ramp"},
    {"slug": "rippling",  "name": "Rippling"},
]

PLATFORM = "greenhouse"
BASE_URL  = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"

# httpx client settings
TIMEOUT_SECONDS  = 20
MAX_RETRIES      = 2
RETRY_WAIT       = 2.0   # seconds between retries


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------

def _normalise_work_mode(location: str | None) -> str | None:
    """Infer work_mode from location string."""
    if not location:
        return None
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"


def _normalise_job_type(title: str, departments: list[str]) -> str | None:
    """
    Greenhouse doesn't expose job_type directly.
    Infer from title keywords and department names.
    """
    combined = (title + " " + " ".join(departments)).lower()
    if any(k in combined for k in ("intern", "internship", "co-op", "coop")):
        return "internship"
    if any(k in combined for k in ("contract", "contractor", "freelance")):
        return "contract"
    if any(k in combined for k in ("part-time", "part time")):
        return "part-time"
    return "full-time"


def _strip_html(html: str | None) -> str | None:
    """Remove HTML tags from job description body."""
    if not html:
        return None
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip() or None


def _make_dedup_hash(company: str, title: str, external_id: str) -> str:
    key = f"{company.lower().strip()}:{title.lower().strip()}:{external_id}"
    return hashlib.sha256(key.encode()).hexdigest()[:64]


def _parse_job(raw: dict[str, Any], company_name: str) -> RawJob | None:
    """
    Map a single Greenhouse API job object to RawJob.
    Returns None if required fields are missing.
    """
    job_id  = str(raw.get("id", ""))
    title   = (raw.get("title") or "").strip()
    url     = (raw.get("absolute_url") or "").strip()

    if not job_id or not title or not url:
        return None

    # Location — Greenhouse can return a list or a single object
    location_raw = raw.get("location") or {}
    location_str: str | None = None
    if isinstance(location_raw, dict):
        location_str = location_raw.get("name") or None
    elif isinstance(location_raw, str):
        location_str = location_raw or None

    # Departments list
    departments: list[str] = [
        d.get("name", "") for d in (raw.get("departments") or [])
    ]

    # Job description — only present when ?content=true
    content_block = raw.get("content") or ""
    description   = _strip_html(content_block)

    # Posted date
    posted_at: datetime | None = None
    updated_at_str = raw.get("updated_at") or raw.get("first_published") or ""
    if updated_at_str:
        try:
            posted_at = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00"))
        except ValueError:
            pass

    return RawJob(
        platform=PLATFORM,
        external_id=job_id,
        title=title,
        company=company_name,
        location=location_str,
        url=url,
        job_type=_normalise_job_type(title, departments),
        work_mode=_normalise_work_mode(location_str),
        raw_description=description,
        posted_at=posted_at,
    )


# ---------------------------------------------------------------------------
# Scraper class
# ---------------------------------------------------------------------------

class GreenhouseScraper:
    """
    Fetches jobs from Greenhouse's public board API for a list of companies.

    Does not extend BaseScraper because this scraper is HTTP-only (no browser).
    Uses the same RawJob dataclass and DB persistence logic for consistency.
    """

    def __init__(
        self,
        companies: list[dict[str, str]] | None = None,
        timeout: float = TIMEOUT_SECONDS,
    ) -> None:
        self._companies = companies or COMPANIES
        self._timeout   = timeout

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    async def run(self) -> int:
        """
        Fetch all jobs from every configured company, dedup, and persist.
        Returns the number of new rows inserted.
        """
        all_jobs: list[RawJob] = []

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for company in self._companies:
                try:
                    jobs = await self._fetch_company(client, company)
                    log.info(
                        "greenhouse: fetched %d jobs from %s",
                        len(jobs),
                        company["name"],
                    )
                    all_jobs.extend(jobs)
                except Exception as exc:
                    # One company failing should not abort the whole run
                    log.error(
                        "greenhouse: failed to fetch %s — %s",
                        company["name"],
                        exc,
                    )

        if not all_jobs:
            log.warning("greenhouse: no jobs collected across all companies")
            return 0

        saved = await self._persist(all_jobs)
        log.info("greenhouse: saved %d new jobs (total fetched: %d)", saved, len(all_jobs))
        return saved

    # ------------------------------------------------------------------
    # Per-company fetch with retry
    # ------------------------------------------------------------------

    async def _fetch_company(
        self,
        client: httpx.AsyncClient,
        company: dict[str, str],
    ) -> list[RawJob]:
        url = BASE_URL.format(slug=company["slug"]) + "?content=true"

        last_error: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 2):   # attempts: 1, 2, 3
            try:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return self._parse_response(data, company["name"])

            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                if status == 404:
                    # Company slug doesn't exist or has no Greenhouse board
                    log.warning(
                        "greenhouse: 404 for %s — slug '%s' may be wrong",
                        company["name"],
                        company["slug"],
                    )
                    return []
                last_error = exc
                log.warning(
                    "greenhouse: HTTP %d for %s (attempt %d/%d)",
                    status, company["name"], attempt, MAX_RETRIES + 1,
                )

            except (httpx.TimeoutException, httpx.ConnectError) as exc:
                last_error = exc
                log.warning(
                    "greenhouse: network error for %s (attempt %d/%d): %s",
                    company["name"], attempt, MAX_RETRIES + 1, exc,
                )

            if attempt <= MAX_RETRIES:
                import asyncio
                await asyncio.sleep(RETRY_WAIT * attempt)

        raise RuntimeError(
            f"greenhouse: gave up on {company['name']} after {MAX_RETRIES + 1} attempts"
        ) from last_error

    # ------------------------------------------------------------------
    # Parse API response
    # ------------------------------------------------------------------

    def _parse_response(
        self,
        data: dict[str, Any],
        company_name: str,
    ) -> list[RawJob]:
        raw_jobs: list[dict] = data.get("jobs") or []
        results: list[RawJob] = []

        for raw in raw_jobs:
            try:
                job = _parse_job(raw, company_name)
                if job is not None:
                    results.append(job)
            except Exception as exc:
                log.warning(
                    "greenhouse: skipped malformed job record — %s", exc
                )

        return results

    # ------------------------------------------------------------------
    # DB persistence (same logic as BaseScraper._persist)
    # ------------------------------------------------------------------

    async def _persist(self, raw_jobs: list[RawJob]) -> int:
        if not raw_jobs:
            return 0

        hashes = [_make_dedup_hash(j.company, j.title, j.external_id or j.url) for j in raw_jobs]

        async with AsyncSessionLocal() as session:
            existing_result = await session.execute(
                select(Job.dedup_hash).where(Job.dedup_hash.in_(hashes))
            )
            existing: set[str] = {row[0] for row in existing_result.all()}

            new_jobs: list[Job] = []
            for job in raw_jobs:
                h = _make_dedup_hash(job.company, job.title, job.external_id or job.url)
                if h in existing:
                    continue
                new_jobs.append(
                    Job(
                        platform=job.platform,
                        external_id=job.external_id,
                        title=job.title,
                        company=job.company,
                        location=job.location,
                        url=job.url,
                        job_type=job.job_type,
                        work_mode=job.work_mode,
                        raw_description=job.raw_description,
                        posted_at=job.posted_at,
                        dedup_hash=h,
                    )
                )

            if new_jobs:
                session.add_all(new_jobs)
                await session.commit()

        return len(new_jobs)
