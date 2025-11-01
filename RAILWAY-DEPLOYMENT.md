# Railway Deployment Guide for ResearchLink Backend Services

## 🚀 Overview

This guide helps you deploy all backend services to Railway:
- Node.js Backend (Port 3003) - Main API Gateway
- Research Journey FastAPI (Port 8002) - AI Research Journey Service
- Python Flask Service (Port 8080) - Paper Analysis & Mentorship
- Multi-Agent FastAPI (Port 8000) - Multi-Agent Mentorship

---

## Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Account** - Code should be on GitHub
3. **Node.js 18+** - For Node.js services
4. **Python 3.11+** - For Python services

---

## Railway Project Structure

Railway supports multiple services in one project. We'll deploy:
1. **Main Backend** (Node.js) - Primary service
2. **Research Journey** (Python FastAPI) - Secondary service
3. **Python Services** (Flask/FastAPI) - Additional services

---

## Part 1: Deploy Node.js Main Backend

### Step 1.1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will detect the project structure

### Step 1.2: Configure Node.js Backend Service

1. **Add Service** → **"Empty Service"**
2. **Settings** → **Source**:
   - **Root Directory**: `/rag-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node production-index-fallback.js`

### Step 1.3: Set Environment Variables

Add these in **Variables** tab:

```env
# Node.js Backend
NODE_ENV=production
PORT=3003

# Firebase Admin (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Gemini API
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Service URLs (will be set after deploying other services)
PYTHON_SERVICE_URL=${{ResearchJourney.RAILWAY_PUBLIC_DOMAIN}}
RESEARCH_JOURNEY_SERVICE_URL=${{ResearchJourney.RAILWAY_PUBLIC_DOMAIN}}
MULTI_AGENT_SERVICE_URL=${{MultiAgent.RAILWAY_PUBLIC_DOMAIN}}

# Email Configuration (Optional)
EMAIL_USER=adeeshabpgcw@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# JWT Secret
JWT_SECRET=your-random-secret-key-here
```

### Step 1.4: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → **Service Accounts**
3. Click **"Generate New Private Key"**
4. Download JSON file
5. Copy values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep newlines as `\n`)

### Step 1.5: Deploy

Railway will automatically:
- Install dependencies
- Build the project
- Start the service
- Provide a public URL

**Copy the public URL** - you'll need it for frontend!

---

## Part 2: Deploy Research Journey FastAPI Service

### Step 2.1: Add New Service

1. In same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Or **"+ New"** → **"Empty Service"**

### Step 2.2: Configure Service

**Settings** → Configure:

- **Root Directory**: `/research journey/research_journey_ai`
- **Build Command**: `cd backend && pip install -r ../requirements.txt`
- **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 2.3: Set Environment Variables

```env
# Research Journey Service
PORT=8002
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
DATABASE_URL=sqlite:///./research_journey.db

# CORS (allow main backend)
CORS_ORIGINS=https://your-main-backend.railway.app
```

### Step 2.4: Update Backend Code for Railway

Railway provides a `PORT` environment variable. Update `backend/main.py`:

```python
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

---

## Part 3: Deploy Multi-Agent FastAPI Service

### Step 3.1: Add Service

Same process as Research Journey:

- **Root Directory**: `/MultiAgents/MA/backend` (adjust based on your structure)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3.2: Environment Variables

```env
PORT=8000
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
```

---

## Part 4: Deploy Python Flask Service (Paper Analysis)

### Step 4.1: Add Service

- **Root Directory**: `/Academic-Mentorship-workflow-using-Langraph` (adjust path)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py` or `flask run --host 0.0.0.0 --port $PORT`

### Step 4.2: Environment Variables

```env
PORT=8080
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
FLASK_ENV=production
```

---

## Part 5: Link Services Together

### Step 5.1: Get Service URLs

Each Railway service gets a public URL. Find them in:
- **Service Settings** → **Networking** → **Public Domain**

Format: `https://your-service-name.railway.app`

### Step 5.2: Update Main Backend Environment Variables

In your **Main Backend** service, update:

```env
PYTHON_SERVICE_URL=https://your-flask-service.railway.app
RESEARCH_JOURNEY_SERVICE_URL=https://your-research-journey.railway.app
MULTI_AGENT_SERVICE_URL=https://your-multi-agent.railway.app
```

Or use Railway's **Service Reference Variables**:

```env
PYTHON_SERVICE_URL=${{FlaskService.RAILWAY_PUBLIC_DOMAIN}}
RESEARCH_JOURNEY_SERVICE_URL=${{ResearchJourney.RAILWAY_PUBLIC_DOMAIN}}
MULTI_AGENT_SERVICE_URL=${{MultiAgent.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Part 6: Create Railway Configuration File (Optional)

Create `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node production-index-fallback.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Part 7: Database Considerations

### Option A: Railway PostgreSQL (Recommended)

1. **Add Service** → **"Database"** → **"PostgreSQL"**
2. Get connection string from **Variables**
3. Update your services to use PostgreSQL instead of SQLite

### Option B: Keep SQLite (Ephemeral)

- SQLite files reset on redeploy
- Not suitable for production
- Use only for development/testing

---

## Part 8: Update Frontend Environment Variables

In **Vercel**, update your frontend:

```env
VITE_API_URL=https://your-main-backend.railway.app
VITE_BACKEND_URL=https://your-main-backend.railway.app
```

---

## Part 9: CORS Configuration

Update `rag-backend/production-index-fallback.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend.vercel.app',
  process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
];
```

---

## Part 10: Monitor and Debug

### View Logs

1. Go to Railway dashboard
2. Click on service
3. **Deployments** → Click latest deployment
4. View **Logs** tab

### Common Issues

**Service Won't Start**
- Check build logs for errors
- Verify `PORT` environment variable is used
- Ensure start command is correct

**Environment Variables Not Working**
- Variables are case-sensitive
- Restart service after adding variables
- Check logs for undefined variables

**Service Can't Reach Other Services**
- Use public domain URLs (not localhost)
- Check networking settings
- Verify CORS configuration

---

## Railway Pricing

- **Free Hobby Plan**: $5/month credit
- **Pro Plan**: $20/month + usage
- **Team Plan**: Custom pricing

**Free tier includes**:
- 500 hours compute/month
- 5GB bandwidth/month
- $5 credit/month

---

## Useful Railway Commands

Install Railway CLI:

```bash
npm i -g @railway/cli
railway login
railway init
railway up
railway logs
railway variables
```

---

## Deployment Checklist

- [ ] Node.js backend deployed and running
- [ ] Research Journey service deployed
- [ ] Multi-Agent service deployed (if needed)
- [ ] Python Flask service deployed (if needed)
- [ ] All environment variables set
- [ ] Service URLs linked correctly
- [ ] CORS configured
- [ ] Frontend updated with backend URL
- [ ] Test all endpoints
- [ ] Monitor logs for errors

---

## Next Steps

1. ✅ Deploy all services to Railway
2. ✅ Update Vercel frontend with Railway URLs
3. ✅ Test complete application
4. ✅ Set up custom domains (optional)
5. ✅ Configure monitoring and alerts

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check service logs in Railway dashboard

