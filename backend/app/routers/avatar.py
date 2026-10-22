from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user import AvatarProfile
from ..schemas.avatar import AvatarProfileResponse, AvatarProfileUpdate

router = APIRouter(prefix="/avatar", tags=["Avatar Profile"])


@router.get("/{user_id}", response_model=AvatarProfileResponse)
def get_avatar(user_id: int, db: Session = Depends(get_db)):
    avatar = db.query(AvatarProfile).filter(AvatarProfile.user_id == user_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Perfil de avatar no encontrado.")
    return avatar


@router.put("/{user_id}", response_model=AvatarProfileResponse)
def update_avatar(user_id: int, updates: AvatarProfileUpdate, db: Session = Depends(get_db)):
    avatar = db.query(AvatarProfile).filter(AvatarProfile.user_id == user_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Perfil de avatar no encontrado.")

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(avatar, field, value)

    db.commit()
    db.refresh(avatar)
    return avatar
