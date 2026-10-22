from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FriendshipBase(BaseModel):
    from_user_id: int
    to_user_id: int
    status: str = "pending"


class FriendshipCreate(FriendshipBase):
    pass


class FriendshipUpdate(BaseModel):
    status: str  # pending | accepted


class FriendshipResponse(FriendshipBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
