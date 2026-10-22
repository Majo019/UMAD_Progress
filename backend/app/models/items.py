from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..core.database import Base


class AvatarItem(Base):
    __tablename__ = "avatar_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(60), nullable=False)  # Nombre del ítem
    slot = Column(String(20), nullable=False)  # head | body | accessory
    required_level = Column(Integer, default=1, nullable=False)  # Nivel requerido
    image = Column(String(200), nullable=True, default="")  # Emoji o ruta de imagen

    user_items = relationship(
        "UserItem",
        back_populates="item",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<AvatarItem id={self.id} name='{self.name}' slot='{self.slot}'>"


class UserItem(Base):
    __tablename__ = "user_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("avatar_items.id", ondelete="CASCADE"), nullable=False)
    equipped = Column(Boolean, default=False, nullable=False)  # Estado de equipamiento

    __table_args__ = (
        UniqueConstraint("user_id", "item_id", name="uq_user_item"),
    )

    user = relationship("User", back_populates="items")
    item = relationship("AvatarItem", back_populates="user_items")

    def __repr__(self):
        return f"<UserItem id={self.id} user_id={self.user_id} item_id={self.item_id} equipped={self.equipped}>"
