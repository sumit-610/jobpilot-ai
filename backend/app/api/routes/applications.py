from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_current_user_id
from app.models.job import Job
from app.models.user import User, Application, UserAction

router = APIRouter()


class CreateApplicationRequest(BaseModel):
    job_id: UUID


@router.get("/")
async def list_applications(
    clerk_id: str = Depends(get_current_user_id),
):
    async with AsyncSessionLocal() as session:

        user_result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            return []

        result = await session.execute(
            select(Application)
            .where(Application.user_id == user.id)
            .order_by(Application.created_at.desc())
        )

        applications = result.scalars().all()

        output = []

        for app in applications:

            job_result = await session.execute(
                select(Job).where(Job.id == app.job_id)
            )
            job = job_result.scalar_one_or_none()

            output.append(
                {
                    "id": str(app.id),
                    "status": app.status,
                    "applied_at": app.applied_at,
                    "job": (
                        {
                            "title": job.title,
                            "company": job.company,
                            "platform": job.platform,
                            "url": job.url,
                        }
                        if job
                        else None
                    ),
                }
            )

        return output


@router.get("/saved")
async def list_saved_jobs(
    clerk_id: str = Depends(get_current_user_id),
):
    async with AsyncSessionLocal() as session:

        user_result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            return []

        actions_result = await session.execute(
            select(UserAction)
            .where(
                UserAction.user_id == user.id,
                UserAction.action == "save",
            )
            .order_by(UserAction.created_at.desc())
        )

        saved_actions = actions_result.scalars().all()

        jobs = []

        for action in saved_actions:

            job_result = await session.execute(
                select(Job).where(Job.id == action.job_id)
            )
            job = job_result.scalar_one_or_none()

            if job:
                jobs.append(
                    {
                        "id": str(job.id),
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "url": job.url,
                        "platform": job.platform,
                        "work_mode": job.work_mode,
                        "salary_min": job.salary_min,
                        "salary_max": job.salary_max,
                        "match_score": 0,
                        "skills_matched": [],
                        "skills_missing": [],
                        "reasoning": "Saved job",
                    }
                )

        return jobs

@router.post("/")
async def create_application(
    body: CreateApplicationRequest,
    clerk_id: str = Depends(get_current_user_id),
):
    async with AsyncSessionLocal() as session:

        user_result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        existing = await session.execute(
            select(Application).where(
                Application.user_id == user.id,
                Application.job_id == body.job_id,
            )
        )

        if existing.scalar_one_or_none():
            return {
                "status": "already_exists",
            }

        application = Application(
            user_id=user.id,
            job_id=body.job_id,
            status="pending",
        )

        session.add(application)
        await session.commit()

        return {
            "status": "created",
        }