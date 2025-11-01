# 🚀 Quick Deployment Guide - ResearchLink

## Overview

This guide provides a quick reference for deploying ResearchLink to:
- **Frontend**: Vercel
- **Backend**: Railway

---

## ⚡ Quick Steps

### 1️⃣ Deploy Backend to Railway (Do this first!)

1. **Go to Railway**: https://railway.app/dashboard
2. **New Project** → **Deploy from GitHub**
3. **Add Service** → **Empty Service**
4. **Settings**:
   - Root Directory: `rag-backend`
   - Build Command: `npm install`
   - Start Command: `node production-index-fallback.js`
5. **Variables** → Add these environment variables:

```env
NODE_ENV=production
PORT=3003
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
```

6. **Get Public URL**: Railway gives you a URL like `https://your-app.railway.app`
7. **Copy this URL** - you'll need it for Vercel!

---

### 2️⃣ Deploy Frontend to Vercel

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Add New Project** → **Import Git Repository**
3. **Framework Preset**: Vite
4. **Root Directory**: `./` (root)
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Environment Variables** → Add:

```env
# Firebase (from Firebase Console)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend URL (from Railway)
VITE_API_URL=https://your-app.railway.app
VITE_BACKEND_URL=https://your-app.railway.app
```

8. **Deploy** → Wait for build
9. **Get your Vercel URL** like `https://your-project.vercel.app`

---

### 3️⃣ Update Backend CORS

Go back to Railway backend service:
1. **Variables** → Update:
```env
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGIN=https://your-project.vercel.app
```
2. **Redeploy** or restart service

---

### 4️⃣ Test Everything

Visit your Vercel URL and test:
- ✅ Login/Signup
- ✅ Dashboard loads
- ✅ Matchmaker works
- ✅ All AI features work

---

## 📋 Environment Variables Cheat Sheet

### Vercel (Frontend)
All variables must start with `VITE_`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=https://your-backend.railway.app
```

### Railway (Backend)
```env
NODE_ENV=production
PORT=3003
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGIN=https://your-frontend.vercel.app
JWT_SECRET=your-random-secret-key
```

---

## 🔧 Additional Services (Optional)

If you want to deploy Research Journey service separately:

### Railway - Research Journey Service

1. **Add New Service** in same Railway project
2. **Settings**:
   - Root Directory: `research journey/research_journey_ai`
   - Build Command: `cd backend && pip install -r ../requirements.txt`
   - Start Command: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Variables**:
```env
PORT=8002
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
```
4. **Get URL** and update main backend:
```env
RESEARCH_JOURNEY_SERVICE_URL=https://research-journey.railway.app
```

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- ✅ Check `VITE_API_URL` in Vercel
- ✅ Check CORS in Railway backend
- ✅ Verify Railway backend is running (check logs)

### Build fails
- ✅ Check all environment variables are set
- ✅ Verify `VITE_` prefix on frontend variables
- ✅ Check Railway/Railway service logs

### Features not working
- ✅ Verify backend URL is correct
- ✅ Check browser console for errors
- ✅ Verify Firebase config is correct

---

## 📚 Detailed Guides

- **Vercel**: See `VERCEL-DEPLOYMENT.md`
- **Railway**: See `RAILWAY-DEPLOYMENT.md`
- **Full Setup**: See `DEPLOYMENT.md`

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] CORS configured
- [ ] All features tested
- [ ] Custom domain configured (optional)

---

**Need Help?** Check the detailed guides or Railway/Vercel documentation!

