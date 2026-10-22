from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CalendarEventBase(BaseModel):
    external_id: Optional[str] = ""
    title: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    start: datetime
    end: Optional[datetime] = None
    all_day: bool = False


class CalendarEventCreate(CalendarEventBase):
    user_id: int


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    all_day: Optional[bool] = None


class CalendarEventResponse(CalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    updated_at: datetime
