from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, nullable=True)  # Opcional
    label = Column(String(120), nullable=True, default="")  # Etiqueta / descripción
    planned_minutes = Column(Integer, default=25, nullable=False)  # Minutos planeados (default: 25)
    status = Column(String(20), default="running", nullable=False)  # running | paused | completed | cancelled
    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_resumed_at = Column(DateTime(timezone=True), nullable=True)  # Opcional
    accumulated_seconds = Column(Integer, default=0, nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)  # Opcional
    xp_earned = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="pomodoro_sessions")

    def __repr__(self):
        return f"<PomodoroSession id={self.id} user_id={self.user_id} status='{self.status}'>"
