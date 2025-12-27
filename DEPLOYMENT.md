# Beacon Deployment Guide

This guide will help you deploy Beacon to production.

## Prerequisites

- Git repository (GitHub, GitLab, or Bitbucket)
- Accounts on:
  - [Vercel](https://vercel.com) (for frontend)
  - [Render](https://render.com) OR [Railway](https://railway.app) (for backend + database)

## Deployment Steps

### Step 1: Prepare Your Repository

1. Ensure all code is committed to Git
2. Push to your remote repository (GitHub recommended)

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy Backend to Render

#### Option A: Using Render Dashboard

1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create:
   - PostgreSQL database
   - Web service for your API

5. Update environment variables:
   - `FRONTEND_URL`: Will be updated after frontend deployment
   - `JWT_SECRET`: Auto-generated
   - `ENCRYPTION_KEY`: Auto-generated

6. Wait for deployment to complete
7. **Copy your backend URL** (e.g., `https://beacon-api.onrender.com`)

#### Option B: Using Railway

1. Go to [Railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `backend` directory
4. Add a PostgreSQL database from the Railway marketplace
5. Set environment variables:
   ```
   DATABASE_URL: (auto-filled by Railway)
   JWT_SECRET: (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ENCRYPTION_KEY: (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   PORT: 3001
   NODE_ENV: production
   FRONTEND_URL: (will update after frontend deployment)
   ```
6. Under Settings → Build, set:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm start`
7. Deploy and **copy your backend URL**

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel will auto-detect the frontend directory
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Add environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api` (use your backend URL from Step 2)

7. Click "Deploy"
8. **Copy your frontend URL** (e.g., `https://beacon.vercel.app`)

### Step 4: Update Backend CORS

1. Go back to your backend service (Render/Railway)
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend service

### Step 5: Run Database Migrations (First Time Only)

Your database will be automatically migrated on deployment. However, it will start empty (no users).

#### Create Your First Admin User

You have two options:

**Option A: Use the seed script (includes test data)**
```bash
# In your local terminal, connect to production database
# Update backend/.env with production DATABASE_URL temporarily
npm run prisma:migrate
npx ts-node prisma/seed.ts
```

**Option B: Clean start (recommended for production)**

Skip seeding and create your first admin user through the database console or API directly.

To create an admin user via database:
```sql
-- Go to your Render/Railway database console and run:
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'your-email@company.com',
  '$2a$10$...',  -- Hash your password first using bcrypt
  'Your Name',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);
```

To hash a password:
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

### Step 6: Clear Dummy Data (Production Only)

If you accidentally seeded with test data and want to clean it:

```bash
# Connect to production database in .env
npx ts-node scripts/clear-dummy-data.ts
```

⚠️ **WARNING**: This deletes ALL data. Only use when setting up a fresh production environment.

## Post-Deployment Checklist

- [ ] Backend is accessible at your Render/Railway URL
- [ ] Frontend is accessible at your Vercel URL
- [ ] Login page loads correctly
- [ ] Can create an admin user
- [ ] Can log in successfully
- [ ] Dashboard loads after login
- [ ] API calls work (check browser console for errors)

## Environment Variables Reference

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-jwt-key
ENCRYPTION_KEY=your-encryption-key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Updating Your Deployment

### Frontend Updates
Vercel auto-deploys on every push to your main branch. Just push your changes:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

### Backend Updates
Render/Railway auto-deploys on every push to your main branch. Push your changes:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

## Troubleshooting

### Frontend can't reach backend
- Check CORS: Ensure `FRONTEND_URL` is set correctly in backend
- Check `VITE_API_URL` in frontend environment variables
- Check browser console for specific errors

### Database connection errors
- Verify `DATABASE_URL` is correctly set
- Ensure Prisma migrations have run: `npx prisma migrate deploy`
- Check database is running on Render/Railway

### Login not working
- Verify `JWT_SECRET` is set
- Check password hashing (bcrypt)
- Look at backend logs for auth errors

## Custom Domain (Optional)

### Frontend (Vercel)
1. Go to your Vercel project → Settings → Domains
2. Add your custom domain (e.g., `app.yourcompany.com`)
3. Configure DNS with your domain provider

### Backend (Render)
1. Go to your Render service → Settings
2. Add custom domain
3. Configure DNS with your domain provider

## Monitoring & Logs

- **Frontend**: Vercel Dashboard → Your Project → Logs
- **Backend**: Render Dashboard → Your Service → Logs
- **Database**: Render Dashboard → Your Database → Metrics

## Need Help?

Check the logs first:
1. Vercel logs for frontend issues
2. Render/Railway logs for backend issues
3. Browser console for client-side errors

Common issues:
- CORS errors → Check FRONTEND_URL environment variable
- 404 on API calls → Check VITE_API_URL is correct
- Database errors → Check DATABASE_URL and migrations
