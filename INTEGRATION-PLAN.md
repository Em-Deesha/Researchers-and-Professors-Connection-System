# Integration Plan: Academic Mentorship Workflow + Match Module

## Overview

This document outlines the integration of the **Academic-Mentorship-workflow-using-Langraph** (Python/Flask) with the **MATCH MODULE** (React/Node.js) to create a unified academic matching and mentorship platform.

## Architecture

### Current Systems

1. **MATCH MODULE** (Main Application)
   - Frontend: React + Vite (Port 3000)
   - Backend: Node.js/Express (Port 3003)
   - Database: Firebase Firestore
   - AI: Google Gemini AI (via Node.js)
   - Features: User matching, chat, profiles, social feed

2. **Academic-Mentorship-workflow-using-Langraph** (Python Service)
   - Backend: Flask (Port 8080)
   - AI Framework: LangGraph + LangChain + Gemini AI
   - Features: 
     - Academic Mentorship Workflow (4-agent sequential pipeline)
     - Research Hub Workflow (Paper analysis)

### Integration Approach

**Option 1: Microservices Architecture (Recommended)**
- Keep Python Flask service as a separate microservice
- Node.js backend acts as API gateway/proxy
- Node.js calls Python Flask API endpoints
- React frontend calls Node.js endpoints (consistent interface)

**Benefits:**
- Separation of concerns
- Independent scaling
- Technology flexibility
- Easier maintenance

### Implementation Plan

#### Phase 1: Python Service API Enhancement

**Goal**: Expose LangGraph workflows as clean REST API endpoints

1. Modify Flask app (`app.py`) to add new endpoints:
   - `/api/mentorship` - Academic mentorship workflow
   - `/api/paper-analysis` - Research paper analysis workflow
   - `/api/health` - Health check (already exists)

2. Ensure CORS is configured for Node.js backend access

#### Phase 2: Node.js Backend Proxy

**Goal**: Add proxy endpoints in Node.js backend to call Python service

1. Add endpoints in `rag-backend/production-index-fallback.js`:
   - `POST /api/mentorship` - Proxy to Python Flask mentorship workflow
   - `POST /api/paper-analysis` - Proxy to Python Flask paper analysis
   - `GET /api/mentorship-health` - Check Python service health

2. Use `axios` or `node-fetch` to make HTTP requests to Python Flask service

#### Phase 3: Frontend Integration

**Goal**: Add new UI components for mentorship and paper analysis features

1. Add new routes/pages in React app:
   - `/mentorship` - Academic mentorship interface
   - `/paper-analysis` - Research paper analysis interface

2. Create UI components:
   - Mentorship form with learning goal input
   - Paper upload interface
   - Results display for both workflows

#### Phase 4: Service Management

**Goal**: Create unified startup and management scripts

1. Update package.json scripts to handle three services:
   - Frontend (Vite)
   - Node.js backend
   - Python Flask service

2. Create startup scripts:
   - `start-all.sh` - Start all three services
   - `start-python-service.sh` - Start Python Flask only

## API Endpoints

### Python Flask Service (Port 8080)

```
POST /api/run-gemini-mentorship
  Body: { "user_input": "I want to learn machine learning" }
  Response: {
    "research_scope": "...",
    "analyst_report": "...",
    "resource_map": "...",
    "final_report": "...",
    "model_used": "gemini-2.0-flash"
  }

POST /api/analyze-paper
  Body: FormData with file upload
  Response: {
    "paper_title": "...",
    "summary": "...",
    "key_concepts": "...",
    "related_resources": "...",
    "professor_suggestions": "..."
  }

GET /api/health
  Response: {
    "status": "healthy",
    "gemini_configured": true,
    "workflows_available": {...}
  }
```

### Node.js Backend Proxy (Port 3003)

```
POST /api/mentorship
  Body: { "user_input": "...", "model": "gemini-2.0-flash" }
  Response: Same as Python Flask response

POST /api/paper-analysis
  Body: FormData with file
  Response: Same as Python Flask response

GET /api/mentorship-health
  Response: Python Flask health status
```

## Configuration

### Environment Variables

**Python Flask Service** (`.env` or `production.env`):
```
GEMINI_API_KEY=your_key_here
FLASK_PORT=8080
FLASK_HOST=0.0.0.0
```

**Node.js Backend** (`rag-backend/production.env`):
```
GEMINI_API_KEY=your_key_here
PYTHON_SERVICE_URL=http://localhost:8080
PORT=3003
```

### CORS Configuration

Python Flask must allow requests from:
- `http://localhost:3003` (Node.js backend)
- `http://localhost:3000` (React frontend, if direct access needed)

## File Structure After Integration

```
MATCH MODULE/
├── src/
│   ├── App.jsx                    # Main React app
│   ├── components/
│   │   ├── MentorshipWorkflow.jsx  # New component
│   │   └── PaperAnalysis.jsx       # New component
│   └── ...
├── rag-backend/
│   ├── production-index-fallback.js  # Enhanced with proxy endpoints
│   └── ...
└── Academic-Mentorship-workflow-using-Langraph/
    ├── app.py                       # Flask service (enhanced)
    └── ...
```

## Benefits of Integration

1. **Enhanced Features**: Add AI-powered mentorship and paper analysis to matchmaking platform
2. **Unified Interface**: Single frontend for all academic services
3. **Better UX**: Users can access mentorship and paper analysis within their existing workflow
4. **Shared Resources**: Leverage existing Firebase authentication and user profiles
5. **Scalability**: Microservices architecture allows independent scaling

## Next Steps

1. ✅ Create integration plan (this document)
2. ✅ Modify Python Flask app for better API structure
3. ✅ Add proxy endpoints in Node.js backend
4. ⏳ Create React components for new features (pending frontend work)
5. ✅ Update startup scripts and documentation
6. ⏳ Testing and validation (backend complete, frontend pending)

