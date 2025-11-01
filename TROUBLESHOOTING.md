# Troubleshooting Guide

## 🚀 Deployment Issues

### Frontend Deployment Problems

**Issue: Environment variables not loading**
- Ensure all variables start with `VITE_` prefix
- Rebuild frontend after adding new variables: `npm run build`
- In Vercel/Netlify: Redeploy after adding environment variables

**Issue: CORS errors in production**
- Check backend CORS configuration includes your frontend domain
- Verify `CORS_ORIGIN` environment variable in backend
- Update `rag-backend/production-index-fallback.js` with production URLs

**Issue: API calls failing**
- Verify `VITE_API_URL` is set correctly
- Ensure backend URL is accessible (test with `curl https://your-backend.com/health`)
- Check browser console for specific error messages

### Backend Deployment Problems

**Issue: Backend crashes on startup**
- Verify all required environment variables are set
- Check Node.js version (requires v18+)
- Review deployment logs for specific errors
- Ensure `NODE_ENV=production` is set

**Issue: Port already in use**
- Check if port 3003 is available
- Railway/Render usually handle this automatically
- For manual deployment, use `PORT` environment variable

**Issue: Database connection fails**
- Verify Firebase credentials are correct
- Check Firestore security rules allow access
- Ensure Firebase Admin SDK is properly configured

For more deployment help, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📄 Paper Analysis & Mentorship Features

## "Failed to fetch" Error

If you see "Error: Failed to fetch" when trying to use Paper Analysis or Academic Mentorship, it means the Python Flask service is not running.

### Quick Fix

**Start the Python Flask service:**

```bash
cd Academic-Mentorship-workflow-using-Langraph
source venv/bin/activate  # if venv exists
python3 app.py
```

You should see:
```
 * Running on http://0.0.0.0:8080
```

### Verify Services Are Running

**Check Python Flask (Port 8080):**
```bash
curl http://localhost:8080/api/health
```

**Check Node.js Backend (Port 3003):**
```bash
curl http://localhost:3003/health
```

**Check Integration:**
```bash
curl http://localhost:3003/api/mentorship-health
```

### Required Services

For Paper Analysis to work:
- ✅ Python Flask service must be running on port 8080

For Academic Mentorship to work:
- ✅ Python Flask service must be running on port 8080
- ✅ Node.js backend must be running on port 3003

### Start All Services

Use the startup script:
```bash
./start-all-services.sh
```

Or start individually:
```bash
# Terminal 1 - Python Flask
cd Academic-Mentorship-workflow-using-Langraph
python3 app.py

# Terminal 2 - Node.js Backend
cd rag-backend
npm start

# Terminal 3 - React Frontend
npm run dev
```

### Common Issues

1. **Port 8080 already in use**
   - Kill the process: `lsof -ti :8080 | xargs kill -9`
   - Or change port in `app.py`

2. **Gemini API Key not set**
   - Export: `export GEMINI_API_KEY=your_key_here`
   - Or set in `.env` file

3. **Python dependencies missing**
   - Install: `pip install -r requirements.txt`

4. **CORS errors**
   - Ensure Python service has flask-cors installed
   - Check CORS configuration in `app.py`

### Error Messages Explained

- **"Failed to fetch"** → Python service not running or unreachable
- **"429 Resource exhausted"** → Gemini API rate limit (wait or use different key)
- **"File size exceeds 16MB"** → Upload a smaller file
- **"Analysis failed"** → Check Python service logs for details

