from typing import Optional
from pydantic import BaseModel, ConfigDict


class AvatarProfileBase(BaseModel):
    level: int = 1
    xp: int = 0
    vida: int = 100
    alimento: int = 100
    carino: int = 100


class AvatarProfileCreate(AvatarProfileBase):
    user_id: int


class AvatarProfileUpdate(BaseModel):
    level: Optional[int] = None
    xp: Optional[int] = None
    vida: Optional[int] = None
    alimento: Optional[int] = None
    carino: Optional[int] = None


class AvatarProfileResponse(AvatarProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
