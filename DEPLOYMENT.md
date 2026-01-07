# Youngin - Monorepo Deployment Guide

## ✅ Setup Complete!

Your project is now configured as a **monorepo** with both frontend and backend in one Vercel project.

### Project Structure
```
Youngin.v2/
├── index.html              ✅ Frontend (root)
├── style.css               ✅ Frontend
├── script.js               ✅ Frontend
├── modules/                ✅ Frontend
├── vercel.json            ✅ Monorepo config (ROOT)
└── Live-Measurements-Api/  ✅ Backend
    ├── api/
    │   └── index.py        ✅ Backend entry point
    ├── requirements.txt    ✅ Python dependencies
    └── .vercelignore      ✅ Ignore files
```

### How It Works

**Frontend:** Served from root
- URL: `https://youngin-two.vercel.app/`

**Backend:** Served from `/api` path
- URL: `https://youngin-two.vercel.app/api/`

### API Endpoints

After deployment, your backend will be available at:

- **Measurements:** `POST https://youngin-two.vercel.app/api/measurements`
- **Chat:** `POST https://youngin-two.vercel.app/api/chat`

## 🚀 Deploy Now

### Step 1: Push to GitHub

```bash
cd Youngin.v2
git add .
git commit -m "Add backend to monorepo"
git push origin main
```

### Step 2: Vercel Auto-Deploys

Since your project is already connected to Vercel, it will **automatically deploy** when you push to GitHub!

### Step 3: Add Environment Variable

1. Go to [vercel.com/zeedans-projects/youngin](https://vercel.com)
2. Click on your "youngin" project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `GENAI_API_KEY`
   - **Value:** `AIzaSyBvFIPuJjli9PWN6F8aWrd-84bAyLx-rXs`
5. Click **Save**
6. Go to **Deployments** → Click **"..."** → **Redeploy**

## 🔧 Update Frontend API Calls

Update your frontend to use the new backend URL.

Find where you make API calls (likely in `modules/ai_sizing.js` or similar) and change:

**Before:**
```javascript
const API_URL = 'http://localhost:5000';
```

**After:**
```javascript
const API_URL = '/api';  // Relative path (same domain)
```

This way:
- Local dev: Uses `/api` (you can proxy it)
- Production: Uses `https://youngin-two.vercel.app/api`

## ✅ That's It!

Your deployment is ready. Just:

1. **Push to GitHub** → Vercel auto-deploys
2. **Add environment variable** → Backend works
3. **Update API URL in frontend** → Frontend connects to backend

Your full-stack app will be live at:
**https://youngin-two.vercel.app** 🎉
