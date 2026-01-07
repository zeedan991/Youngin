# Youngin Backend - Vercel Deployment

## ✅ Files Ready for Deployment

Your backend is now configured for Vercel! Here's what was set up:

### File Structure
```
Live-Measurements-Api/
├── api/
│   └── index.py          ✅ Your Flask app (Vercel entry point)
├── requirements.txt      ✅ Updated with opencv-python-headless
├── vercel.json          ✅ Vercel configuration
├── .vercelignore        ✅ Excludes unnecessary files
└── .env                 ⚠️  Add to Vercel dashboard (not deployed)
```

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare backend for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New" → "Project"**
3. **Import your Git repository**
4. Select the `Live-Measurements-Api` folder (or root if this is the only project)
5. Vercel will auto-detect Python
6. Click **"Deploy"**

### Step 3: Add Environment Variables

After deployment, add your API key:

1. Go to your project on Vercel
2. **Settings** → **Environment Variables**
3. Add:
   - Name: `GENAI_API_KEY`
   - Value: `AIzaSyBvFIPuJjli9PWN6F8aWrd-84bAyLx-rXs`
4. Click **"Save"**
5. **Redeploy** the project

## 🔗 Your Backend URL

After deployment, you'll get a URL like:
```
https://your-project-name.vercel.app
```

## ⚠️ Important Limitations

1. **10-second timeout** - If AI processing takes longer, it will fail
2. **No file storage** - Uploaded images are temporary
3. **4.5MB limit** - Max request/response size
4. **Cold starts** - First request after inactivity is slow

## 🔧 Update Frontend

Once deployed, update your frontend API URL:

In your Youngin frontend code, change:
```javascript
const API_URL = 'https://your-backend.vercel.app';
```

## 📝 Test Your Deployment

Test the endpoints:
```bash
# Health check
curl https://your-backend.vercel.app/

# Test measurements endpoint
curl -X POST https://your-backend.vercel.app/measurements \
  -F "front=@front.jpg" \
  -F "height_cm=170"

# Test chat endpoint
curl -X POST https://your-backend.vercel.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## ✅ You're All Set!

Your backend is ready to deploy. Just:
1. Push to GitHub
2. Connect to Vercel
3. Deploy!

Good luck! 🚀
