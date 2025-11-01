# Vercel Deployment Guide for ResearchLink Frontend

## 🚀 Quick Overview

This guide will help you deploy the ResearchLink React frontend to Vercel.

## Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables** - Prepare your Firebase and API keys

---

## Step 1: Prepare Your Project

### 1.1 Create `vercel.json` Configuration

Create a `vercel.json` file in the root directory:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 1.2 Update Vite Config for Production

Ensure your `vite.config.js` has production settings:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
```

---

## Step 2: Set Up Environment Variables

### 2.1 Required Environment Variables

You'll need to set these in Vercel dashboard:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API URL (Your Railway deployment URL)
VITE_API_URL=https://your-app.railway.app
VITE_BACKEND_URL=https://your-app.railway.app
```

### 2.2 Where to Find Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ Settings → Project settings
4. Scroll to "Your apps" → Web app
5. Copy the config values

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import Git Repository**
   - Select your GitHub repository
   - Authorize Vercel to access your repos if needed

4. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from Step 2.1
   - Set for **Production**, **Preview**, and **Development**

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)

7. **Access Your Site**
   - Vercel will provide a URL like: `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd /home/adeesha-waheed/Documents/MATCH\ MODULE
vercel

# For production deployment
vercel --prod
```

---

## Step 4: Update Frontend API URLs

### 4.1 Update `src/firebase-config.js`

Make sure it uses environment variables:

```javascript
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 4.2 Update API Calls in `src/App.jsx`

Replace hardcoded `localhost:3003` with environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Example fetch
const response = await fetch(`${API_BASE_URL}/api/research-journey/sessions`, {
  // ...
});
```

---

## Step 5: Configure CORS in Backend

Make sure your Railway backend allows requests from your Vercel domain:

In `rag-backend/production-index-fallback.js`:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-project.vercel.app', // Add your Vercel URL
      process.env.FRONTEND_URL || 'https://your-project.vercel.app'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

---

## Step 6: Custom Domain (Optional)

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel will automatically configure SSL

---

## Step 7: Enable Automatic Deployments

- **Push to `main` branch** → Auto-deploys to production
- **Create pull request** → Auto-deploys preview
- **Manual deployments** → Available in dashboard

---

## Troubleshooting

### Build Fails

**Error: Cannot find module**
```bash
# Check if node_modules is in .gitignore
# Ensure all dependencies are in package.json
npm install
```

**Error: Environment variables not found**
- Double-check variable names start with `VITE_`
- Rebuild after adding variables

### Runtime Errors

**API calls failing**
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration in backend
- Ensure Railway backend is running

**Firebase errors**
- Verify all Firebase env variables are set
- Check Firebase project settings
- Ensure Firebase security rules allow your domain

---

## Useful Commands

```bash
# View deployment logs
vercel logs

# View deployment info
vercel inspect

# Redeploy
vercel --prod --force

# Set environment variable via CLI
vercel env add VITE_API_URL production
```

---

## Next Steps

1. ✅ Deploy backend to Railway (see RAILWAY-DEPLOYMENT.md)
2. ✅ Update `VITE_API_URL` with Railway URL
3. ✅ Test all features work
4. ✅ Set up custom domain (optional)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Check deployment logs in Vercel dashboard

