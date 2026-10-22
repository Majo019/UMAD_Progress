from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PomodoroSessionBase(BaseModel):
    task_id: Optional[int] = None
    label: Optional[str] = ""
    planned_minutes: int = 25
    status: str = "running"
    accumulated_seconds: int = 0
    xp_earned: int = 0


class PomodoroSessionCreate(PomodoroSessionBase):
    user_id: int
    started_at: Optional[datetime] = None


class PomodoroSessionUpdate(BaseModel):
    status: Optional[str] = None
    accumulated_seconds: Optional[int] = None
    last_resumed_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    xp_earned: Optional[int] = None


class PomodoroSessionResponse(PomodoroSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    started_at: datetime
    last_resumed_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
