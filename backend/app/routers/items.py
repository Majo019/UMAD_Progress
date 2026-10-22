from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.items import AvatarItem, UserItem
from ..schemas.items import (
    AvatarItemCreate,
    AvatarItemResponse,
    UserItemCreate,
    UserItemResponse,
    UserItemUpdate
)

router = APIRouter(prefix="/items", tags=["Avatar Items & Inventory"])


@router.get("/", response_model=List[AvatarItemResponse])
def get_all_items(db: Session = Depends(get_db)):
    return db.query(AvatarItem).all()


@router.post("/", response_model=AvatarItemResponse, status_code=status.HTTP_201_CREATED)
def create_avatar_item(item_data: AvatarItemCreate, db: Session = Depends(get_db)):
    item = AvatarItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/inventory/{user_id}", response_model=List[UserItemResponse])
def get_user_inventory(user_id: int, db: Session = Depends(get_db)):
    return db.query(UserItem).filter(UserItem.user_id == user_id).all()


@router.post("/acquire", response_model=UserItemResponse, status_code=status.HTTP_201_CREATED)
def acquire_item(item_data: UserItemCreate, db: Session = Depends(get_db)):
    existing = db.query(UserItem).filter(
        (UserItem.user_id == item_data.user_id) & (UserItem.item_id == item_data.item_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya posee este ítem.")

    user_item = UserItem(**item_data.model_dump())
    db.add(user_item)
    db.commit()
    db.refresh(user_item)
    return user_item


@router.patch("/inventory/{user_item_id}/equip", response_model=UserItemResponse)
def toggle_equip_item(user_item_id: int, equip_data: UserItemUpdate, db: Session = Depends(get_db)):
    user_item = db.query(UserItem).filter(UserItem.id == user_item_id).first()
    if not user_item:
        raise HTTPException(status_code=404, detail="Ítem de inventario no encontrado.")

    user_item.equipped = equip_data.equipped
    db.commit()
    db.refresh(user_item)
    return user_item
