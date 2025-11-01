from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

Base = declarative_base()

class StudentSession(Base):
    __tablename__ = "student_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    student_name = Column(String, nullable=True)
    area_of_interest = Column(String, nullable=True)
    selected_topic = Column(String, nullable=True)
    research_questions = Column(Text, nullable=True)
    literature_summary = Column(Text, nullable=True)
    proposal_title = Column(String, nullable=True)
    proposal_abstract = Column(Text, nullable=True)
    proposal_objectives = Column(Text, nullable=True)
    proposal_methodology = Column(Text, nullable=True)
    professor_contact_notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Pydantic models for API
class SessionCreate(BaseModel):
    session_id: str
    student_name: Optional[str] = None
    area_of_interest: Optional[str] = None

class SessionUpdate(BaseModel):
    student_name: Optional[str] = None
    area_of_interest: Optional[str] = None
    selected_topic: Optional[str] = None
    research_questions: Optional[str] = None
    literature_summary: Optional[str] = None
    proposal_title: Optional[str] = None
    proposal_abstract: Optional[str] = None
    proposal_objectives: Optional[str] = None
    proposal_methodology: Optional[str] = None
    professor_contact_notes: Optional[str] = None
    is_completed: Optional[bool] = None

class SessionResponse(BaseModel):
    id: int
    session_id: str
    student_name: Optional[str]
    area_of_interest: Optional[str]
    selected_topic: Optional[str]
    research_questions: Optional[str]
    literature_summary: Optional[str]
    proposal_title: Optional[str]
    proposal_abstract: Optional[str]
    proposal_objectives: Optional[str]
    proposal_methodology: Optional[str]
    professor_contact_notes: Optional[str]
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

