from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..core.database import get_db
from ..models.friendship import Friendship
from ..schemas.friendship import FriendshipCreate, FriendshipResponse, FriendshipUpdate

router = APIRouter(prefix="/friends", tags=["Social & Friends"])


@router.get("/{user_id}", response_model=List[FriendshipResponse])
def get_user_friends(user_id: int, db: Session = Depends(get_db)):
    return db.query(Friendship).filter(
        or_(Friendship.from_user_id == user_id, Friendship.to_user_id == user_id)
    ).all()


@router.post("/request", response_model=FriendshipResponse, status_code=status.HTTP_201_CREATED)
def send_friend_request(request_data: FriendshipCreate, db: Session = Depends(get_db)):
    if request_data.from_user_id == request_data.to_user_id:
        raise HTTPException(status_code=400, detail="No puedes enviarte una solicitud de amistad a ti mismo.")

    existing = db.query(Friendship).filter(
        (Friendship.from_user_id == request_data.from_user_id) & (Friendship.to_user_id == request_data.to_user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud o amistad entre ambos usuarios.")

    friendship = Friendship(**request_data.model_dump())
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


@router.patch("/{friendship_id}/status", response_model=FriendshipResponse)
def update_friendship_status(friendship_id: int, status_update: FriendshipUpdate, db: Session = Depends(get_db)):
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(status_code=404, detail="Solicitud de amistad no encontrada.")

    friendship.status = status_update.status
    db.commit()
    db.refresh(friendship)
    return friendship
