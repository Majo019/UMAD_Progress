from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(150), nullable=True, default="")
    last_name = Column(String(150), nullable=True, default="")
    is_active = Column(Boolean, default=True, nullable=False)
    is_staff = Column(Boolean, default=False, nullable=False)
    date_joined = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relaciones del diagrama
    avatar = relationship(
        "AvatarProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    calendar_events = relationship(
        "CalendarEvent",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    friend_requests_sent = relationship(
        "Friendship",
        foreign_keys="[Friendship.from_user_id]",
        back_populates="from_user",
        cascade="all, delete-orphan"
    )
    friend_requests_received = relationship(
        "Friendship",
        foreign_keys="[Friendship.to_user_id]",
        back_populates="to_user",
        cascade="all, delete-orphan"
    )
    pomodoro_sessions = relationship(
        "PomodoroSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    items = relationship(
        "UserItem",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User id={self.id} username='{self.username}'>"


class AvatarProfile(Base):
    __tablename__ = "avatar_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    level = Column(Integer, default=1, nullable=False)   # Nivel actual (default: 1)
    xp = Column(Integer, default=0, nullable=False)      # XP del nivel actual
    vida = Column(Integer, default=100, nullable=False)  # Salud (default: 100)
    alimento = Column(Integer, default=100, nullable=False)  # Nutrición (default: 100)
    carino = Column(Integer, default=100, nullable=False)    # Afecto (default: 100)

    user = relationship("User", back_populates="avatar")

    def __repr__(self):
        return f"<AvatarProfile id={self.id} user_id={self.user_id} level={self.level}>"
