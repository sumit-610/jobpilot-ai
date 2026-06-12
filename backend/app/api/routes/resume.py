from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id

router = APIRouter()

# TODO: implement resume routes