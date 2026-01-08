# Youngin Deployment Guide

## Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub repository

### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Select your repository
3. Render will auto-detect `render.yaml` configuration
4. **Important**: Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyBvFIPuJjli9PWN6F8aWrd-84bAyLx-rXs`
5. Click "Create Web Service"
6. Wait for deployment (first deploy takes ~10-15 minutes due to PyTorch)
7. Copy your backend URL (e.g., `https://youngin-backend.onrender.com`)

### Step 3: Update CORS
After getting your Vercel URL, update the `ALLOWED_ORIGINS` environment variable in Render:
- Value: `https://your-app.vercel.app,https://www.your-domain.com`

---

## Frontend Deployment (Vercel)

### Step 1: Update Backend URL
1. Open `vercel.json`
2. Replace `https://youngin-backend.onrender.com` with your actual Render URL

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as default)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Click "Deploy"
6. Your frontend will be live at `https://your-app.vercel.app`

---

## Testing

### Test Backend Health
```bash
curl https://your-backend.onrender.com/health
```

Should return: `{"status": "healthy", "service": "youngin-api"}`

### Test Frontend
1. Visit your Vercel URL
2. Test AI Sizing feature
3. Test Chatbot feature

---

## Important Notes

- **First Request Delay**: Render free tier spins down after 15 minutes of inactivity. First request may take 30-60 seconds.
- **API Key Security**: Never commit `.env` file to git
- **CORS**: Update `ALLOWED_ORIGINS` in Render after deploying to Vercel
