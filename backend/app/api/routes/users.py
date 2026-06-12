from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_current_user_id
from app.models.user import User

router = APIRouter()


async def get_or_create_user(clerk_id: str) -> User:
    """
    Look up user by Clerk ID. Create a row if one doesn't exist yet.

    Email uses a placeholder on first creation because the Clerk user ID
    is all we have from the JWT at this point. Update it later when
    building the full user-sync flow.
    """
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
            await session.commit()
            await session.refresh(user)

        return user


@router.get("/me")
async def get_me(clerk_id: str = Depends(get_current_user_id)):
    """
    Returns the current user's DB record.
    Creates the user row on first call (login sync).
    """
    user = await get_or_create_user(clerk_id)
    return {
        "clerk_id": user.clerk_id,
        "email": user.email,
        "full_name": user.full_name,
        "has_resume": user.resume_parsed is not None,
        "preferences": user.preferences,
    }


@router.put("/preferences")
async def update_preferences(
    preferences: dict,
    user_id: str = Depends(get_current_user_id),
):
    # TODO: persist to users.preferences
    return {"status": "ok"}