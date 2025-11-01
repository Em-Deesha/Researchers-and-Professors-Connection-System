from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from dotenv import load_dotenv

from .db import get_db, init_db
from .models import StudentSession, SessionCreate, SessionUpdate, SessionResponse
from .crud import (
    create_session, get_session, update_session, 
    get_all_sessions, delete_session, create_new_session_id
)
from .ai_agent import ResearchJourneyAI

load_dotenv()

app = FastAPI(title="AI Research Journey API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Initialize AI agent
try:
    ai_agent = ResearchJourneyAI()
except ValueError as e:
    print(f"Warning: {e}")
    ai_agent = None

@app.get("/")
async def root():
    return {"message": "AI Research Journey API is running!"}

@app.post("/sessions", response_model=SessionResponse)
async def create_new_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """Create a new research session"""
    return create_session(db, session_data)

@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session_by_id(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific session by ID"""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.put("/sessions/{session_id}", response_model=SessionResponse)
async def update_session_data(
    session_id: str,
    session_data: SessionUpdate,
    db: Session = Depends(get_db)
):
    """Update session data"""
    session = update_session(db, session_id, session_data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/sessions", response_model=List[SessionResponse])
async def get_all_sessions_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all sessions"""
    return get_all_sessions(db, skip=skip, limit=limit)

@app.delete("/sessions/{session_id}")
async def delete_session_data(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Delete a session"""
    success = delete_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

@app.post("/suggest-topic")
async def suggest_topic(request: dict):
    """Generate topic suggestions based on area of interest"""
    if not ai_agent:
        raise HTTPException(status_code=500, detail="AI agent not initialized. Please check GEMINI_API_KEY.")
    
    area_of_interest = request.get("area_of_interest", "")
    if not area_of_interest:
        raise HTTPException(status_code=400, detail="area_of_interest is required")
    
    try:
        suggestions = ai_agent.suggest_topics(area_of_interest)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")

@app.post("/literature-summary")
async def get_literature_summary(request: dict):
    """Generate literature review summary"""
    if not ai_agent:
        raise HTTPException(status_code=500, detail="AI agent not initialized. Please check GEMINI_API_KEY.")
    
    selected_topic = request.get("selected_topic", "")
    if not selected_topic:
        raise HTTPException(status_code=400, detail="selected_topic is required")
    
    try:
        summary = ai_agent.generate_literature_summary(selected_topic)
        return {"literature_summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating literature summary: {str(e)}")

@app.post("/generate-proposal")
async def generate_research_proposal(request: dict):
    """Generate research proposal components"""
    if not ai_agent:
        raise HTTPException(status_code=500, detail="AI agent not initialized. Please check GEMINI_API_KEY.")
    
    topic = request.get("topic", "")
    research_questions = request.get("research_questions", "")
    
    if not topic:
        raise HTTPException(status_code=400, detail="topic is required")
    
    try:
        proposal = ai_agent.generate_proposal(topic, research_questions)
        return {"proposal": proposal}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating proposal: {str(e)}")

@app.post("/professor-guidance")
async def get_professor_guidance(request: dict):
    """Generate guidance for contacting professors"""
    if not ai_agent:
        raise HTTPException(status_code=500, detail="AI agent not initialized. Please check GEMINI_API_KEY.")
    
    topic = request.get("topic", "")
    if not topic:
        raise HTTPException(status_code=400, detail="topic is required")
    
    try:
        guidance = ai_agent.generate_professor_contact_guidance(topic)
        return {"guidance": guidance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating guidance: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ai_agent_available": ai_agent is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

