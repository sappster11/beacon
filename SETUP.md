# Beacon Setup Guide

Quick start guide to get Beacon running locally.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git

## Step-by-Step Setup

### 1. Database Setup

First, create the PostgreSQL database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE beacon;

# Create user (optional)
CREATE USER beacon_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE beacon TO beacon_user;

# Exit psql
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

Update `.env`:
```
DATABASE_URL="postgresql://beacon_user:your_password@localhost:5432/beacon"
JWT_SECRET="your-random-secret-key-here"
PORT=3001
```

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Backend should now be running on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment (already set to localhost:3001)
cp .env.example .env

# Start development server
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### 4. Create Test Data (Optional)

You can use Prisma Studio to create initial users:

```bash
cd backend
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can:
1. Create a test user
2. Create departments
3. Set up org hierarchy

Or create users programmatically through the API.

## Verification

1. Visit `http://localhost:5173`
2. You should see the Beacon login page
3. Backend API health check: `http://localhost:3001/api/health`

## Common Issues

### Port Already in Use

If ports 3001 or 5173 are in use:

**Backend**: Change `PORT` in `backend/.env`
**Frontend**: Vite will automatically use a different port, or update `vite.config.ts`

### Database Connection Failed

- Ensure PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Verify DATABASE_URL in `backend/.env`
- Check PostgreSQL user permissions

### Prisma Migration Errors

Reset database (WARNING: deletes all data):
```bash
cd backend
npx prisma migrate reset
npm run prisma:migrate
```

## Next Steps

1. Create your first user via the API or Prisma Studio
2. Set up departments and org hierarchy
3. Create a review cycle
4. Explore the different modules

## Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Run production build
npm run prisma:generate   # Regenerate Prisma client
npm run prisma:migrate    # Run migrations
npx prisma studio    # Open Prisma Studio GUI
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

See `README.md` for production deployment instructions.
