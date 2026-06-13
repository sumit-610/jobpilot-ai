import hashlib
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal
from app.core.security import get_current_user_id
from app.models.job import Job
from app.models.user import UserAction

router = APIRouter()


SAMPLE_JOBS = [
    {
        "title": "Product Manager",
        "company": "Razorpay",
        "location": "Bangalore, India",
        "job_type": "full-time",
        "work_mode": "hybrid",
        "platform": "sample",
        "url": "https://razorpay.com/jobs",
        "salary_min": 2500000,
        "salary_max": 4000000,
    },
    {
        "title": "Operations Associate",
        "company": "Zepto",
        "location": "Mumbai, India",
        "job_type": "full-time",
        "work_mode": "onsite",
        "platform": "sample",
        "url": "https://www.zeptonow.com/careers",
        "salary_min": 800000,
        "salary_max": 1200000,
    },
    {
        "title": "Business Analyst",
        "company": "Meesho",
        "location": "Bangalore, India",
        "job_type": "full-time",
        "work_mode": "hybrid",
        "platform": "sample",
        "url": "https://meesho.io/jobs",
        "salary_min": 1200000,
        "salary_max": 1800000,
    },
    {
        "title": "Product Intern",
        "company": "Groww",
        "location": "Bangalore, India",
        "job_type": "internship",
        "work_mode": "hybrid",
        "platform": "sample",
        "url": "https://groww.in/careers",
        "salary_min": 50000,
        "salary_max": 80000,
    },
    {
        "title": "Founder's Office Associate",
        "company": "Blue Energy Motors",
        "location": "Bangalore, India",
        "job_type": "full-time",
        "work_mode": "onsite",
        "platform": "sample",
        "url": "https://blueenergymotors.com/careers",
        "salary_min": 1000000,
        "salary_max": 1500000,
    },
]


def _make_hash(title: str, company: str) -> str:
    key = f"{company.lower().strip()}:{title.lower().strip()}:sample"
    return hashlib.sha256(key.encode()).hexdigest()[:64]


@router.get("/")
async def list_jobs(
    clerk_id: str = Depends(get_current_user_id),
):
    async with AsyncSessionLocal() as session:

        count_result = await session.execute(select(func.count()).select_from(Job))
        total = count_result.scalar()

        if total == 0:
            for s in SAMPLE_JOBS:
                job = Job(
                    title=s["title"],
                    company=s["company"],
                    location=s["location"],
                    job_type=s["job_type"],
                    work_mode=s["work_mode"],
                    platform=s["platform"],
                    url=s["url"],
                    salary_min=s["salary_min"],
                    salary_max=s["salary_max"],
                    dedup_hash=_make_hash(s["title"], s["company"]),
                )
                session.add(job)
            await session.commit()

        result = await session.execute(
            select(Job).order_by(Job.scraped_at.desc())
        )
        jobs = result.scalars().all()

    return [
        {
            "id": str(job.id),
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "job_type": job.job_type,
            "work_mode": job.work_mode,
            "url": job.url,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,

            "match_score": 85,
            "skills_matched": [],
            "skills_missing": [],
            "reasoning": "Sample job for MVP testing", 
        }
        for job in jobs
    ]


class ActionRequest(BaseModel):
    action: str  # approve | reject | save


@router.post("/{job_id}/action")
async def record_action(
    job_id: UUID,
    body: ActionRequest,
    clerk_id: str = Depends(get_current_user_id),
):
    if body.action not in ("approve", "reject", "save"):
        raise HTTPException(status_code=400, detail="action must be approve | reject | save")

    async with AsyncSessionLocal() as session:
        action = UserAction(
            job_id=job_id,
            user_id=clerk_id,
            action=body.action,
        )
        session.add(action)
        await session.commit()

    return {"status": "ok", "action": body.action}
