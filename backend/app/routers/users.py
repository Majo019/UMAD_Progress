from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.user import User, AvatarProfile
from ..schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users & Auth"])


@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(User).offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Validar si ya existe username o email
    existing = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="El nombre de usuario o correo electrónico ya se encuentra registrado."
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,  # En prod se recomienda hashear
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        is_active=user_data.is_active,
        is_staff=user_data.is_staff
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Crear perfil de avatar inicial vinculado (1:1)
    avatar = AvatarProfile(user_id=user.id)
    db.add(avatar)
    db.commit()

    return user
