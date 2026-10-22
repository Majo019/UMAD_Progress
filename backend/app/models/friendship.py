from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending | accepted
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("from_user_id", "to_user_id", name="uq_friendship_from_to"),
    )

    from_user = relationship("User", foreign_keys=[from_user_id], back_populates="friend_requests_sent")
    to_user = relationship("User", foreign_keys=[to_user_id], back_populates="friend_requests_received")

    def __repr__(self):
        return f"<Friendship id={self.id} from={self.from_user_id} to={self.to_user_id} status='{self.status}'>"
