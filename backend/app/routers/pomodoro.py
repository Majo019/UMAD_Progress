from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.pomodoro import PomodoroSession
from ..schemas.pomodoro import PomodoroSessionCreate, PomodoroSessionResponse, PomodoroSessionUpdate

router = APIRouter(prefix="/pomodoro", tags=["Pomodoro Sessions"])


@router.get("/sessions/{user_id}", response_model=List[PomodoroSessionResponse])
def get_user_sessions(user_id: int, db: Session = Depends(get_db)):
    return db.query(PomodoroSession).filter(
        PomodoroSession.user_id == user_id
    ).order_by(PomodoroSession.started_at.desc()).all()


@router.post("/sessions/", response_model=PomodoroSessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(session_data: PomodoroSessionCreate, db: Session = Depends(get_db)):
    session = PomodoroSession(**session_data.model_dump(exclude_unset=True))
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/sessions/{session_id}", response_model=PomodoroSessionResponse)
def update_session(session_id: int, updates: PomodoroSessionUpdate, db: Session = Depends(get_db)):
    session = db.query(PomodoroSession).filter(PomodoroSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión Pomodoro no encontrada.")

    for field, val in updates.model_dump(exclude_unset=True).items():
        setattr(session, field, val)

    db.commit()
    db.refresh(session)
    return session
