# Starting TT with AI Backend

## Quick Start

The TT with AI backend should run on **port 8001** to avoid conflicts with the MultiAgents backend (port 8000).

### Option 1: Using uvicorn directly

```bash
cd "/home/adeesha-waheed/Documents/MATCH MODULE/TT with AI/backend"
source ../.venv/bin/activate  # or create venv: python -m venv .venv
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

### Option 2: Using Python module

```bash
cd "/home/adeesha-waheed/Documents/MATCH MODULE/TT with AI"
source .venv/bin/activate
cd backend
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIRESTORE_ENABLED=true
FIRESTORE_PROJECT_ID=academic-matchmaker-prod
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

## Verification

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

Test the health endpoint:
```bash
curl http://localhost:8001/health
```

Expected response: `{"status": "ok"}`

## Integration

The backend is now integrated with the main MATCH MODULE:
- Proxy endpoint: `http://localhost:3003/api/verify-professor`
- Health check: `http://localhost:3003/api/tt-with-ai/health`
- Accessible from professor profile pages via "Verify Professor" button

