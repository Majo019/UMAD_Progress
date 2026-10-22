from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String(100), nullable=True, default="")  # Identificador frontend
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True, default="")
    category = Column(String(50), nullable=True, default="")
    start = Column(DateTime(timezone=True), nullable=False)
    end = Column(DateTime(timezone=True), nullable=True)  # Opcional
    all_day = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="calendar_events")

    def __repr__(self):
        return f"<CalendarEvent id={self.id} user_id={self.user_id} title='{self.title}'>"
