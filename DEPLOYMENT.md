# 🚀 ResearchLink Deployment Guide

Complete guide for deploying ResearchLink to production.

## 📋 Table of Contents

- [Deployment Overview](#deployment-overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Option 1: Vercel + Railway (Recommended)](#option-1-vercel--railway-recommended)
- [Option 2: Docker Deployment](#option-2-docker-deployment)
- [Option 3: Platform-Specific](#option-3-platform-specific)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

---

## 📦 Deployment Overview

Your ResearchLink application consists of:

1. **React Frontend** (Vite) - Port 3000
2. **Node.js Backend** (Express) - Port 3003
3. **Python Flask Service** (LangGraph) - Port 8080 (Optional)
4. **FastAPI Service** (MultiAgents) - Port 8000 (Optional)
5. **Firestore Database** (Firebase) - Cloud-based

### Deployment Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │────────▶│   Backend       │
│   (Vercel)      │  API    │   (Railway)     │
└─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │   Firestore     │
                            │   (Firebase)    │
                            └─────────────────┘
```

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Gemini API key obtained
- [ ] Gmail app password for email functionality
- [ ] Domain name (optional, but recommended)
- [ ] SSL certificates (usually handled by hosting provider)

---

## 🎯 Option 1: Vercel + Railway (Recommended)

This is the easiest and most cost-effective option for most users.

### Step 1: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build your frontend:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```
   
   Or connect your GitHub repository directly in the [Vercel Dashboard](https://vercel.com).

4. **Configure Environment Variables in Vercel:**
   
   Go to Project Settings → Environment Variables and add:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_API_URL=https://your-backend-url.railway.app
   ```

5. **Redeploy** after adding environment variables.

### Step 2: Deploy Backend to Railway

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create a New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service:**
   - Root Directory: `rag-backend`
   - Build Command: `npm install`
   - Start Command: `node production-index-fallback.js`

4. **Add Environment Variables:**
   
   In Railway dashboard, go to Variables tab and add:
   ```
   GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ
   JWT_SECRET=your-very-strong-secret-key-here-min-32-chars
   PORT=3003
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   EMAIL_USER=adeeshabpgcw@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   FIREBASE_PROJECT_ID=your-project-id
   ```

5. **Deploy:**
   - Railway will automatically detect Node.js and deploy
   - Wait for deployment to complete
   - Copy your Railway URL (e.g., `https://researchlink-backend.railway.app`)

6. **Update Frontend API URL:**
   - Go back to Vercel dashboard
   - Update `VITE_API_URL` to your Railway backend URL
   - Redeploy frontend

7. **Update Backend CORS:**
   
   Edit `rag-backend/production-index-fallback.js` and update CORS origins:
   ```javascript
   const corsOptions = {
     origin: [
       'https://your-frontend.vercel.app',
       'https://your-custom-domain.com'
     ],
     // ... rest of config
   };
   ```

### Step 3: Verify Deployment

1. **Test Frontend:** Visit your Vercel URL
2. **Test Backend:** Visit `https://your-backend.railway.app/health`
3. **Test Integration:** Try logging in and using features

---

## 🐳 Option 2: Docker Deployment

Deploy everything using Docker containers.

### Prerequisites

- Docker and Docker Compose installed
- A VPS or cloud server (AWS EC2, DigitalOcean, etc.)

### Step 1: Create Dockerfile for Frontend

Create `Dockerfile.frontend` in project root:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Create Dockerfile for Backend

Create `rag-backend/Dockerfile.backend`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3003
CMD ["node", "production-index-fallback.js"]
```

### Step 3: Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://backend:3003
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./rag-backend
      dockerfile: Dockerfile.backend
    ports:
      - "3003:3003"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3003
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:3000,https://your-domain.com
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_APP_PASSWORD=${EMAIL_APP_PASSWORD}
    env_file:
      - ./rag-backend/production.env
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Step 4: Deploy

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## ☁️ Option 3: Platform-Specific

### AWS Deployment

#### Frontend (S3 + CloudFront)

1. **Build frontend:**
   ```bash
   npm run build
   ```

2. **Upload to S3:**
   - Create S3 bucket
   - Enable static website hosting
   - Upload `dist/` folder contents

3. **Setup CloudFront:**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Enable HTTPS

#### Backend (Elastic Beanstalk)

1. **Prepare deployment:**
   ```bash
   cd rag-backend
   npm install --production
   ```

2. **Deploy to EB:**
   ```bash
   eb init
   eb create researchlink-backend
   eb deploy
   ```

3. **Set environment variables in EB console**

### Google Cloud Platform

#### Frontend (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

#### Backend (Cloud Run)

1. **Create Dockerfile** (see Option 2)

2. **Build and deploy:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/researchlink-backend
   gcloud run deploy researchlink-backend \
     --image gcr.io/PROJECT_ID/researchlink-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Netlify (Frontend) + Render (Backend)

#### Frontend on Netlify

1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

#### Backend on Render

1. Create new Web Service
2. Connect GitHub repo
3. Root directory: `rag-backend`
4. Build command: `npm install`
5. Start command: `node production-index-fallback.js`
6. Add environment variables

---

## 🔐 Environment Variables

### Frontend Environment Variables

Create `.env` file in project root:

```env
# API Configuration
VITE_API_URL=https://your-backend-url.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend Environment Variables

Create `rag-backend/production.env`:

```env
# AI Configuration
GEMINI_API_KEY=AIzaSyBHvhl-plYiluCkaHuyXMo7AOWg_628qQ

# Server Configuration
PORT=3003
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com,https://your-domain.com

# Security
JWT_SECRET=your-very-strong-secret-key-minimum-32-characters-long

# Email Configuration
EMAIL_USER=adeeshabpgcw@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Firebase Admin (if using Firebase Admin SDK)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Getting Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_APP_PASSWORD`

---

## ✅ Post-Deployment

### 1. Update API URLs in Frontend

If you haven't already, update `src/App.jsx` to use environment variable:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Replace all hardcoded 'http://localhost:3003' with API_URL
```

### 2. Update CORS Configuration

Edit `rag-backend/production-index-fallback.js`:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://your-frontend.vercel.app',
      'https://your-custom-domain.com',
      ...(process.env.CORS_ORIGIN?.split(',') || [])
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  // ... rest of config
};
```

### 3. Configure Firestore Security Rules

Update rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{collection}/{document} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow users to write their own data
      allow write: if request.auth != null && 
                     (request.auth.uid == resource.data.authorId || 
                      request.auth.uid == request.resource.data.authorId);
    }
    
    // Chat messages
    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid in resource.data.participants;
    }
  }
}
```

### 4. Set Up Monitoring

- **Vercel:** Built-in analytics and logs
- **Railway:** Built-in metrics dashboard
- **Error Tracking:** Consider adding Sentry
- **Uptime Monitoring:** Use UptimeRobot or similar

### 5. Configure Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

**Railway:**
1. Go to Service Settings → Networking
2. Add custom domain
3. Configure DNS records

---

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptom:** `Access-Control-Allow-Origin` errors in browser console

**Solution:**
- Check backend CORS configuration includes your frontend URL
- Verify `CORS_ORIGIN` environment variable is set correctly
- Ensure backend allows credentials if using cookies

#### 2. API Connection Failed

**Symptom:** "Failed to fetch" or network errors

**Solution:**
- Verify `VITE_API_URL` is set correctly in frontend
- Check backend is running and accessible
- Test backend health endpoint: `curl https://your-backend-url.com/health`
- Check firewall/security group settings allow traffic

#### 3. Environment Variables Not Loading

**Symptom:** Frontend shows undefined values for environment variables

**Solution:**
- Ensure all variables start with `VITE_` prefix
- Rebuild frontend after changing environment variables
- In Vercel/Netlify, redeploy after adding new variables

#### 4. Backend Not Starting

**Symptom:** Backend crashes on startup

**Solution:**
- Check all required environment variables are set
- Verify Node.js version (requires v18+)
- Check logs for specific error messages
- Ensure port is not already in use

#### 5. Firebase Authentication Not Working

**Symptom:** Users can't log in

**Solution:**
- Verify Firebase config in frontend `.env`
- Check Firebase Authentication is enabled in Firebase Console
- Verify Firestore security rules allow authentication
- Check browser console for specific Firebase errors

### Debug Commands

```bash
# Test backend health
curl https://your-backend-url.com/health

# Test backend API
curl -X POST https://your-backend-url.com/smart-match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"researchInterests": "test"}'

# Check environment variables (in production)
# Vercel: Dashboard → Settings → Environment Variables
# Railway: Dashboard → Service → Variables
```

---

## 📊 Cost Estimates

### Free Tier (Suitable for Small Projects)

- **Vercel:** Free tier includes generous limits
- **Railway:** $5/month or free trial
- **Firebase:** Free tier available
- **Total:** ~$5-10/month

### Production Tier

- **Vercel Pro:** $20/month (if needed)
- **Railway Pro:** $10-20/month
- **Firebase:** Pay-as-you-go (usually <$10/month)
- **Custom Domain:** $10-15/year
- **Total:** ~$40-60/month

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Frontend loads without errors
- [ ] Backend health endpoint responds
- [ ] User can register/login
- [ ] Smart matching works
- [ ] Chat functionality works
- [ ] File uploads work
- [ ] Email notifications work
- [ ] Mobile responsiveness works
- [ ] HTTPS is enabled
- [ ] Custom domain configured (if applicable)

---

## 📞 Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review backend logs
- Check Firebase Console for errors
- Open an issue on GitHub

---

**Last Updated:** January 2025

