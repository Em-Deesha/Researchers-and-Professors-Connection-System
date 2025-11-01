from sqlalchemy.orm import Session
from .models import StudentSession, SessionCreate, SessionUpdate
from typing import Optional, List
import uuid

def create_session(db: Session, session_data: SessionCreate) -> StudentSession:
    db_session = StudentSession(**session_data.dict())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_session(db: Session, session_id: str) -> Optional[StudentSession]:
    return db.query(StudentSession).filter(StudentSession.session_id == session_id).first()

def get_session_by_id(db: Session, session_id: str) -> Optional[StudentSession]:
    return db.query(StudentSession).filter(StudentSession.session_id == session_id).first()

def update_session(db: Session, session_id: str, session_data: SessionUpdate) -> Optional[StudentSession]:
    db_session = db.query(StudentSession).filter(StudentSession.session_id == session_id).first()
    if db_session:
        for key, value in session_data.dict(exclude_unset=True).items():
            setattr(db_session, key, value)
        db.commit()
        db.refresh(db_session)
    return db_session

def get_all_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[StudentSession]:
    return db.query(StudentSession).offset(skip).limit(limit).all()

def delete_session(db: Session, session_id: str) -> bool:
    db_session = db.query(StudentSession).filter(StudentSession.session_id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False

def create_new_session_id() -> str:
    return str(uuid.uuid4())

