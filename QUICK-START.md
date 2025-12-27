# Beacon - Quick Start Deployment

## 🚀 Deploy in 15 Minutes

### Step 1: Push to GitHub (2 min)
```bash
cd /Users/jacob/beacon
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/beacon.git
git push -u origin main
```

### Step 2: Deploy Backend (5 min)

**Using Render.com (Recommended - Easiest)**

1. Go to https://render.com/register
2. Connect your GitHub account
3. Click "New +" → "Blueprint"
4. Select your `beacon` repository
5. Render auto-detects `render.yaml` and deploys!
6. **Save your backend URL**: `https://beacon-api-XXXX.onrender.com`

### Step 3: Deploy Frontend (5 min)

**Using Vercel (Recommended - Easiest)**

1. Go to https://vercel.com/signup
2. Connect your GitHub account
3. Click "Add New" → "Project"
4. Select your `beacon` repository
5. Configure:
   - Root Directory: `frontend`
   - Framework: Vite
   - Add Environment Variable:
     - Key: `VITE_API_URL`
     - Value: `https://YOUR-BACKEND-URL.onrender.com/api`
6. Click "Deploy"
7. **Save your frontend URL**: `https://beacon-XXXX.vercel.app`

### Step 4: Update Backend CORS (2 min)

1. Go to your Render dashboard
2. Select your `beacon-api` service
3. Go to "Environment"
4. Update `FRONTEND_URL` to your Vercel URL
5. Click "Save Changes" (auto-redeploys)

### Step 5: Create Your First User (1 min)

**Option A: Keep test users**
The database is already seeded with:
- Email: `admin@beacon.com`
- Password: `password123`

**Option B: Clean start (recommended)**
```bash
# Update backend/.env DATABASE_URL to production
npm run clear:data

# Then create your admin user via database console
```

## ✅ You're Live!

Visit your Vercel URL and log in!

## 📋 Post-Deployment

1. **Change default password** if using test users
2. **Set up custom domain** (optional)
3. **Configure Google Calendar** (optional)
4. **Import your employee data**

## 🆘 Troubleshooting

**Can't log in?**
- Check backend logs on Render
- Verify JWT_SECRET is set
- Check database connection

**CORS errors?**
- Verify FRONTEND_URL is set correctly in backend
- Verify VITE_API_URL is set correctly in frontend

**API not working?**
- Check backend is deployed and running
- Check VITE_API_URL has `/api` at the end
- Check browser console for errors

## 📚 More Info

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
