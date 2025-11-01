# Integration Guide: Academic Mentorship Workflow + Match Module

## Overview

This guide explains how to use the integrated Academic Matchmaker system that combines:
- **Match Module**: React frontend + Node.js backend (smart matching, chat, profiles)
- **Academic Mentorship Workflow**: Python Flask service with LangGraph (mentorship & paper analysis)

## Architecture

```
┌─────────────────┐
│  React Frontend │  Port 3000
│   (Vite/React)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js Backend│  Port 3003
│   (Express)     │  ← API Gateway/Proxy
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Firebase       │  │  Python Flask   │  Port 8080
│  Firestore      │  │  (LangGraph)    │  ← Mentorship & Paper Analysis
└─────────────────┘  └─────────────────┘
```

## Quick Start

### Option 1: Start All Services (Recommended)

```bash
./start-all-services.sh
```

This starts:
- Python Flask service (port 8080)
- Node.js backend (port 3003)
- React frontend (port 3000)

### Option 2: Start Services Separately

**Terminal 1 - Python Service:**
```bash
./start-python-service.sh
# Or manually:
cd Academic-Mentorship-workflow-using-Langraph
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

**Terminal 2 - Node.js Backend:**
```bash
cd rag-backend
npm start
```

**Terminal 3 - React Frontend:**
```bash
npm run dev
```

## Service URLs

After starting all services:

| Service | URL | Description |
|---------|-----|-------------|
| React Frontend | http://localhost:3000 | Main application UI |
| Node.js Backend | http://localhost:3003 | API gateway |
| Python Flask | http://localhost:8080 | LangGraph workflows |

## API Endpoints

### Node.js Backend (Port 3003)

#### Mentorship Workflow
```bash
POST /api/mentorship
Content-Type: application/json

{
  "user_input": "I want to learn machine learning",
  "model": "gemini-2.0-flash"  # optional
}

Response:
{
  "research_scope": "...",
  "analyst_report": "...",
  "resource_map": "...",
  "final_report": "...",
  "model_used": "gemini-2.0-flash"
}
```

#### Paper Analysis
**Note**: Currently, paper analysis should call Python service directly:
```bash
POST http://localhost:8080/api/paper-analysis
Content-Type: multipart/form-data

# Send file with key "file"
```

#### Health Checks
```bash
GET /health              # Node.js backend health
GET /api/mentorship-health  # Python service health check
```

### Python Flask Service (Port 8080)

#### Mentorship Workflow
```bash
POST /api/mentorship
# OR
POST /api/run-gemini-mentorship

Content-Type: application/json
{
  "user_input": "I want to learn Python programming",
  "model": "gemini-2.0-flash"  # optional
}
```

#### Paper Analysis
```bash
POST /api/paper-analysis
# OR
POST /api/analyze-paper

Content-Type: multipart/form-data
# Send file with key "file"
```

#### Health Check
```bash
GET /api/health
```

## Configuration

### Environment Variables

**Python Flask Service** (`.env` or set in environment):
```bash
export GEMINI_API_KEY=your_gemini_api_key_here
```

**Node.js Backend** (`rag-backend/production.env`):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PYTHON_SERVICE_URL=http://localhost:8080  # optional, defaults to localhost:8080
PORT=3003
JWT_SECRET=your_jwt_secret
```

### Python Dependencies

Install Python dependencies:
```bash
cd Academic-Mentorship-workflow-using-Langraph
pip install -r requirements.txt
```

**Required packages:**
- flask
- flask-cors (for CORS support)
- langchain
- langchain-google-genai
- langgraph
- PyPDF2 (for PDF processing)
- python-docx (for DOCX processing)

## Usage Examples

### 1. Test Mentorship Workflow via Node.js Backend

```bash
curl -X POST http://localhost:3003/api/mentorship \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "I want to learn deep learning for computer vision"
  }'
```

### 2. Test Mentorship Workflow Directly (Python Service)

```bash
curl -X POST http://localhost:8080/api/mentorship \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "I want to learn machine learning"
  }'
```

### 3. Test Paper Analysis (Python Service Direct)

```bash
curl -X POST http://localhost:8080/api/paper-analysis \
  -F "file=@/path/to/research_paper.pdf"
```

### 4. Check Service Health

```bash
# Node.js backend
curl http://localhost:3003/health

# Python service
curl http://localhost:8080/api/health

# Check Python service from Node.js
curl http://localhost:3003/api/mentorship-health
```

## Integration Features

### ✅ Completed

1. **Python Flask Service Enhanced**
   - Added CORS support for Node.js backend
   - Added `/api/mentorship` endpoint (alias for existing endpoint)
   - Added `/api/paper-analysis` endpoint (alias)
   - JSON request support (in addition to form data)

2. **Node.js Backend Proxy**
   - Added `/api/mentorship` proxy endpoint
   - Added `/api/mentorship-health` health check
   - Python service availability checking
   - Error handling with helpful messages

3. **Startup Scripts**
   - `start-python-service.sh` - Start Python Flask only
   - `start-all-services.sh` - Start all three services

### ⏳ Pending (Frontend Integration)

The React frontend can now call these endpoints:
- `POST /api/mentorship` - For academic mentorship workflow
- `POST http://localhost:8080/api/paper-analysis` - For paper analysis (direct to Python)

**Next Steps for Frontend:**
1. Add UI components for mentorship workflow
2. Add UI components for paper analysis
3. Integrate with existing navigation/routing

## Troubleshooting

### Python Service Not Starting

**Error**: `GEMINI_API_KEY is not set`

**Solution**:
```bash
export GEMINI_API_KEY=your_key_here
cd Academic-Mentorship-workflow-using-Langraph
python3 app.py
```

### Node.js Backend Can't Connect to Python Service

**Error**: `Python mentorship service is not available`

**Solution**:
1. Ensure Python service is running: `curl http://localhost:8080/api/health`
2. Check `PYTHON_SERVICE_URL` in Node.js backend env
3. Verify firewall/network settings

### CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solution**:
- Python Flask has CORS enabled for localhost ports
- Node.js backend has CORS enabled
- If issues persist, check `flask-cors` is installed: `pip install flask-cors`

### Port Already in Use

**Error**: `Address already in use`

**Solution**:
- Change port in respective config files
- Or kill process using the port:
  ```bash
  # Find process
  lsof -i :8080  # Python
  lsof -i :3003  # Node.js
  lsof -i :3000  # React
  
  # Kill process
  kill -9 <PID>
  ```

## Development Tips

1. **Start Python service first** - Node.js backend checks for it
2. **Use separate terminals** - Easier to monitor logs
3. **Check health endpoints** - Verify services before testing
4. **Monitor logs** - Each service logs to console
5. **Test endpoints directly** - Use curl/Postman before frontend integration

## Architecture Benefits

1. **Separation of Concerns**: Each service has a specific purpose
2. **Independent Scaling**: Scale services based on load
3. **Technology Flexibility**: Python for ML, Node.js for API, React for UI
4. **Maintainability**: Changes to one service don't affect others
5. **Development Speed**: Work on services independently

## Next Steps

1. ✅ Backend integration complete
2. ⏳ Frontend UI components for mentorship
3. ⏳ Frontend UI components for paper analysis
4. ⏳ User authentication integration
5. ⏳ Save mentorship results to user profiles

---

**Need Help?** Check the logs of each service or the health endpoints.

