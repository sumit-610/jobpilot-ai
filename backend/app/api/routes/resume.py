from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_current_user_id
from app.models.user import User
from app.services.ai.resume_parser import parse_resume_pdf

router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    clerk_id: str = Depends(get_current_user_id),
):
    if not file.filename.endswith((".pdf", ".PDF")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes supported for now."
        )

    content = await file.read()

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large (max 5MB)."
        )

    parsed = await parse_resume_pdf(content)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                clerk_id=clerk_id,
                email=f"{clerk_id}@placeholder.jobpilot.local",
            )
            session.add(user)

        user.resume_url = file.filename
        user.resume_parsed = parsed

        await session.commit()

    return {
        "status": "uploaded",
        "parsed": parsed,
    }


@router.get("/parsed")
async def get_parsed_resume(
    clerk_id: str = Depends(get_current_user_id),
):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.clerk_id == clerk_id)
        )

        user = result.scalar_one_or_none()

        if not user or not user.resume_parsed:
            raise HTTPException(
                status_code=404,
                detail="No parsed resume found. Upload one first.",
            )

        return user.resume_paresume_parsed
