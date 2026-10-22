from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.calendar import CalendarEvent
from ..schemas.calendar import CalendarEventCreate, CalendarEventResponse, CalendarEventUpdate

router = APIRouter(prefix="/calendar", tags=["Calendar Events"])


@router.get("/events/{user_id}", response_model=List[CalendarEventResponse])
def get_user_events(user_id: int, db: Session = Depends(get_db)):
    return db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).order_by(CalendarEvent.start).all()


@router.post("/events/", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_data: CalendarEventCreate, db: Session = Depends(get_db)):
    event = CalendarEvent(**event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    db.delete(event)
    db.commit()
    return None
