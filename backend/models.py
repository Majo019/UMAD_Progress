"""
Re-exportación para compatibilidad. Los modelos modulares se encuentran en backend.app.models
"""
try:
    from backend.app.models import (
        User,
        AvatarProfile,
        CalendarEvent,
        Friendship,
        PomodoroSession,
        AvatarItem,
        UserItem,
    )
except ImportError:
    from app.models import (
        User,
        AvatarProfile,
        CalendarEvent,
        Friendship,
        PomodoroSession,
        AvatarItem,
        UserItem,
    )

__all__ = [
    "User",
    "AvatarProfile",
    "CalendarEvent",
    "Friendship",
    "PomodoroSession",
    "AvatarItem",
    "UserItem",
]
