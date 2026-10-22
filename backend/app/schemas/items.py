from typing import Optional
from pydantic import BaseModel, ConfigDict


class AvatarItemBase(BaseModel):
    name: str
    slot: str  # head | body | accessory
    required_level: int = 1
    image: Optional[str] = ""


class AvatarItemCreate(AvatarItemBase):
    pass


class AvatarItemResponse(AvatarItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class UserItemBase(BaseModel):
    user_id: int
    item_id: int
    equipped: bool = False


class UserItemCreate(UserItemBase):
    pass


class UserItemUpdate(BaseModel):
    equipped: bool


class UserItemResponse(UserItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item: Optional[AvatarItemResponse] = None
