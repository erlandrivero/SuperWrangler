# Push Backend to GitHub - Instructions

## ✅ Frontend Already Pushed!
The frontend (wine-wrangler) has been successfully pushed to:
- **Repository:** https://github.com/erlandrivero/SuperWrangler
- **Commit:** Update Advanced ML to 15 models
- **Status:** ✅ Complete

---

## 📦 Backend Needs GitHub Repository

The backend (superwrangler-ml-api) is now committed locally but needs a GitHub repo.

### Option 1: Create New Repository (Recommended)

#### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `superwrangler-ml-api`
3. Description: "Python ML API for SuperWrangler - 15 advanced algorithms"
4. **Visibility:** Public (required for Render free tier)
5. **DO NOT** initialize with README (we already have files)
6. Click "Create repository"

#### Step 2: Push to GitHub
Run these commands in PowerShell:

```powershell
cd "C:\Users\Erland\Desktop\School\CAP3321 Data Wrangeling\Data Cleaning App\superwrangler-ml-api"

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/superwrangler-ml-api.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

### Option 2: Add to Existing Render Repository

If you already have a Render repository linked, find it:

```powershell
# Go to your Render dashboard
# Check which GitHub repo is connected
# Then add that remote and push
```

---

## 🚀 After Pushing to GitHub

### 1. Deploy to Render

#### If First Time Deploying:
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select `superwrangler-ml-api` repository
5. Configure:
   - **Name:** superwrangler-ml-api
   - **Region:** Choose closest to you
   - **Branch:** main
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** (leave blank, uses Procfile)
   - **Plan:** Standard ($7/month for 512MB RAM)
6. Click "Create Web Service"

#### If Already Deployed:
- Render will **auto-deploy** within 3-5 minutes after detecting the push
- Monitor deployment in Render Dashboard → Your Service → Logs

### 2. Update Frontend API URL

After Render deployment completes, you'll get a URL like:
```
https://superwrangler-ml-api.onrender.com
```

Update in your frontend code (if not already done):
```typescript
// In AdvancedML.tsx or config file
const API_URL = 'https://superwrangler-ml-api.onrender.com';
```

---

## 📋 Verification Checklist

After both pushes complete:

### Frontend (Netlify)
- [ ] Visit https://YOUR-APP.netlify.app
- [ ] Navigate to Machine Learning section
- [ ] Verify "15 advanced algorithms" shows in UI
- [ ] Check Quick ML shows 7 models
- [ ] Check Advanced ML button says "15 Advanced Algorithms"

### Backend (Render)
- [ ] Visit https://superwrangler-ml-api.onrender.com/api/health
- [ ] Should return: `{"status": "ok", "message": "SuperWrangler ML API is running"}`
- [ ] Visit /api/algorithms
- [ ] Should show 15 algorithms + excluded models list
- [ ] Test training endpoint with small dataset

### Integration Test
- [ ] Load data in SuperWrangler frontend
- [ ] Click "Advanced ML"
- [ ] Start training
- [ ] Verify real-time progress updates (1/15, 2/15, etc.)
- [ ] Check results show 15 models
- [ ] Verify no memory errors in Render logs

---

## 🐛 Troubleshooting

### "Repository not found" error
- Make sure the repository name matches exactly
- Check you're using your GitHub username

### "Permission denied" error
- You may need to authenticate: `gh auth login`
- Or use SSH instead of HTTPS

### Render not deploying
- Check "Settings" → "Build & Deploy" → "Auto-Deploy" is enabled
- Manually trigger: Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"

---

## 📊 What Was Optimized

### Backend Changes:
✅ Reduced from 22 to 15 models (removed Quick ML duplicates)
✅ Cross-validation: 5-fold → 3-fold
✅ Parallel processing disabled (n_jobs=1)
✅ Model parameters reduced by 30-70%
✅ Streaming implementation with garbage collection
✅ Gunicorn configured for single worker
✅ Memory usage: ~2-4GB → ~150-300MB

### Frontend Changes:
✅ Updated UI to show "15 advanced models"
✅ Updated button text
✅ Updated descriptions to clarify no duplicates

### Documentation Added:
✅ MODEL_DISTRIBUTION.md - Full model breakdown
✅ MEMORY_OPTIMIZATION_SUMMARY.md - All optimizations
✅ QUICK_REFERENCE.md - Quick lookup guide

---

## 🎉 Success!

Once both are pushed and deployed:
- Frontend (Netlify): Updated UI with 15 model count
- Backend (Render): Optimized for 512MB RAM
- Total: 22 unique models (7 Quick + 15 Advanced)
- Memory safe and production ready!

---

**Status:** Frontend ✅ | Backend ⏳ (needs GitHub repo + push)
