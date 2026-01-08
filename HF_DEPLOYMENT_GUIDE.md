# Hugging Face Spaces Deployment Guide

## Step 1: Create Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co) and sign up
2. Verify your email

## Step 2: Create a New Space

1. Click your profile → "New Space"
2. Configure:
   - **Space name**: `youngin-backend` (or your choice)
   - **License**: MIT
   - **SDK**: Docker
   - **Hardware**: CPU basic (free)
3. Click "Create Space"

## Step 3: Upload Your Code

### Option A: Using Git (Recommended)

```bash
# Navigate to your backend directory
cd Live-Measurements-Api

# Initialize git if not already done
git init

# Add HF Space as remote (replace USERNAME and SPACE_NAME)
git remote add hf https://huggingface.co/spaces/USERNAME/SPACE_NAME

# Add all files
git add .

# Commit
git commit -m "Initial deployment to HF Spaces"

# Push to HF
git push hf main
```

### Option B: Using Web Interface

1. In your Space, click "Files" → "Add file"
2. Upload these files from `Live-Measurements-Api`:
   - `Dockerfile`
   - `README.md`
   - `requirements.txt`
   - `.env.example`
   - Entire `api/` folder

## Step 4: Configure Secrets

1. In your Space, go to "Settings"
2. Scroll to "Repository secrets"
3. Add secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBvFIPuJjli9PWN6F8aWrd-84bAyLx-rXs`
4. Click "Add secret"

## Step 5: Wait for Build

- HF Spaces will automatically build your Docker container
- This takes ~10-15 minutes for first build
- Watch the "Logs" tab for progress

## Step 6: Get Your API URL

Once deployed, your API will be at:
```
https://USERNAME-SPACE_NAME.hf.space
```

Example: `https://zeedan991-youngin-backend.hf.space`

## Step 7: Test Your API

```bash
# Test health endpoint
curl https://YOUR-SPACE-URL.hf.space/health

# Should return: {"status":"healthy","service":"youngin-api"}
```

## Step 8: Update Frontend

1. Open `vercel.json` in your main project
2. Update the destination URL:
```json
{
    "version": 2,
    "rewrites": [
        {
            "source": "/api/:path*",
            "destination": "https://YOUR-SPACE-URL.hf.space/:path*"
        }
    ]
}
```

3. Commit and push to deploy frontend

## Troubleshooting

### Build Fails
- Check "Logs" tab for errors
- Ensure all files are uploaded correctly
- Verify Dockerfile syntax

### API Not Responding
- Check if Space is "Running" (not sleeping)
- Verify secrets are set correctly
- Check application logs

### CORS Errors
- Add your Vercel URL to `ALLOWED_ORIGINS` secret
- Format: `https://your-app.vercel.app`

---

## Important Notes

- **Free tier sleeps after 48h inactivity**
- **First request after sleep takes ~30s**
- **16 GB RAM available** (enough for PyTorch!)
- **Persistent storage**: Not included in free tier
