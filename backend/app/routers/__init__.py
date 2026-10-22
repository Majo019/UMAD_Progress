from fastapi import APIRouter
from .users import router as users_router
from .avatar import router as avatar_router
from .calendar import router as calendar_router
from .pomodoro import router as pomodoro_router
from .friendship import router as friendship_router
from .items import router as items_router

api_router = APIRouter()
api_router.include_router(users_router)
api_router.include_router(avatar_router)
api_router.include_router(calendar_router)
api_router.include_router(pomodoro_router)
api_router.include_router(friendship_router)
api_router.include_router(items_router)

__all__ = ["api_router"]
