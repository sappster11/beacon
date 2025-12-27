# Beacon - Performance Management System

Custom performance tracking software to replace Trackstar.

## Project Structure

```
beacon/
├── frontend/              # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI components (buttons, modals, forms)
│   │   ├── pages/         # Route-based pages (Dashboard, Reviews, Goals)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API client, utilities, helpers
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main app component
│   └── package.json
│
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   │   ├── auth.ts        # Authentication (login, JWT)
│   │   │   ├── users.ts       # User management, org chart
│   │   │   └── [future: reviews.ts, goals.ts, one-on-ones.ts]
│   │   ├── controllers/   # Business logic (to be added)
│   │   ├── middleware/    # Auth, validation, error handling
│   │   │   └── auth.ts        # JWT middleware, role checks
│   │   ├── services/      # External integrations (Gusto, Calendar)
│   │   ├── lib/
│   │   │   └── db.ts          # Prisma client singleton
│   │   └── server.ts      # Express app entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── .env               # Environment variables (DO NOT COMMIT)
│   └── package.json
│
└── README.md
```

## Where Do Files Go?

### Backend

**Routes** (`backend/src/routes/`):
- Define HTTP endpoints (GET, POST, PATCH, DELETE)
- Example: `/api/users`, `/api/reviews`, `/api/goals`
- When to add: Creating new API endpoints

**Controllers** (`backend/src/controllers/`):
- Business logic separated from routes
- When to add: Complex logic that doesn't belong in routes

**Middleware** (`backend/src/middleware/`):
- Cross-cutting concerns (auth, validation, logging)
- Example: `auth.ts` for JWT authentication
- When to add: Logic needed across multiple routes

**Services** (`backend/src/services/`):
- External API integrations
- Example: Gusto sync, Google Calendar
- When to add: Connecting to third-party services

**Lib** (`backend/src/lib/`):
- Shared utilities and database client
- Example: `db.ts` for Prisma client
- When to add: Shared helper functions

### Frontend

**Pages** (`frontend/src/pages/`):
- Top-level route components
- Example: `Dashboard.tsx`, `Reviews.tsx`, `Goals.tsx`
- When to add: New route/screen in the app

**Components** (`frontend/src/components/`):
- Reusable UI components
- Example: `Button.tsx`, `Modal.tsx`, `ReviewForm.tsx`
- When to add: UI element used in multiple places

**Hooks** (`frontend/src/hooks/`):
- Custom React hooks
- Example: `useAuth.ts`, `useFetch.ts`
- When to add: Reusable stateful logic

**Lib** (`frontend/src/lib/`):
- API client and utilities
- Example: `api.ts` for API calls, `utils.ts` for helpers
- When to add: Shared functions not tied to React

**Types** (`frontend/src/types/`):
- TypeScript type definitions
- Example: User, Review, Goal types
- When to add: Shared types across components

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript (Vite) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (ready for Auth0/Clerk) |

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Edit .env file with your database URL and secrets
   DATABASE_URL="postgresql://user:password@localhost:5432/beacon"
   JWT_SECRET="your-secret-key"
   ```

4. Run Prisma migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

Backend runs on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:5173`

## Database Schema

### Core Models
- **User** - Employee profiles with org hierarchy (manager, department)
- **Department** - Hierarchical department structure
- **ReviewCycle** - Quarterly/semi-annual/annual review periods
- **Review** - Performance reviews with 1-4 rating scale
- **PeerFeedback** - Anonymous peer feedback for reviews
- **Goal** - OKRs with parent/child alignment
- **OneOnOne** - Manager-employee 1:1 meetings
- **DevelopmentPlan** - Career development tracking

### Key Features
- **Org Chart**: Users have `managerId` for reporting structure
- **Anonymous Feedback**: PeerFeedback stores giver but not shown to receiver
- **Goal Alignment**: Goals have `parentGoalId` for OKR cascading
- **1-4 Rating Scale**: 1=Does Not Meet, 2=Partially Meets, 3=Meets, 4=Exceeds

## API Endpoints

Complete API documentation: `backend/API.md`

### Auth
- `POST /api/auth/login` - User login

### Users & Organization
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/org/chart` - Get org chart
- `GET /api/users/:id/reports` - Get direct reports
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user

### Departments
- `GET /api/departments` - List all departments
- `GET /api/departments/tree` - Get department hierarchy
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department
- `PATCH /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Review Cycles & Reviews
- `GET /api/reviews/cycles` - List review cycles
- `POST /api/reviews/cycles` - Create review cycle
- `GET /api/reviews/my-reviews` - Get my reviews
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/:id/self-assessment` - Submit self-assessment
- `PATCH /api/reviews/:id/manager-assessment` - Submit manager assessment
- `POST /api/reviews/:reviewId/peer-feedback` - Submit anonymous peer feedback
- `GET /api/reviews/:reviewId/peer-feedback` - Get peer feedback

### Goals (OKRs)
- `GET /api/goals/my-goals` - Get my goals
- `GET /api/goals/user/:userId` - Get user's goals
- `GET /api/goals/company` - Get company goals
- `GET /api/goals/:id` - Get goal by ID
- `GET /api/goals/:id/tree` - Get goal alignment tree
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal
- `PATCH /api/goals/:id/progress` - Update goal progress
- `DELETE /api/goals/:id` - Delete goal

### One-on-One Meetings
- `GET /api/one-on-ones/my-meetings` - Get my 1:1s
- `GET /api/one-on-ones/upcoming` - Get upcoming 1:1s
- `GET /api/one-on-ones/:id` - Get 1:1 by ID
- `POST /api/one-on-ones` - Create 1:1
- `PATCH /api/one-on-ones/:id` - Update 1:1
- `PATCH /api/one-on-ones/:id/shared-notes` - Update shared notes
- `PATCH /api/one-on-ones/:id/manager-notes` - Update manager notes
- `PATCH /api/one-on-ones/:id/action-items` - Update action items
- `PATCH /api/one-on-ones/:id/complete` - Mark as completed
- `PATCH /api/one-on-ones/:id/cancel` - Cancel meeting
- `DELETE /api/one-on-ones/:id` - Delete 1:1

### Development Plans
- `GET /api/development-plans/my-plan` - Get my development plan
- `GET /api/development-plans/user/:userId` - Get user's plan
- `GET /api/development-plans/:id` - Get plan by ID
- `POST /api/development-plans` - Create plan
- `PATCH /api/development-plans/:id` - Update plan
- `PATCH /api/development-plans/:id/progress` - Update progress
- `DELETE /api/development-plans/:id` - Delete plan

## Implementation Status

### Phase 1: Foundation ✅
- [x] Project setup (React + Node.js + PostgreSQL)
- [x] Authentication and user management
- [x] Basic org chart and employee profiles
- [x] Role-based permissions

### Phase 2: Core Features ✅
- [x] One-on-one meeting module
- [x] Review cycle configuration
- [x] Self and manager assessments with 1-4 rating scale
- [x] Anonymous peer feedback system
- [x] Goal tracking with OKR alignment
- [x] Development plans

### Phase 3: Frontend (In Progress)
- [ ] Frontend UI components
- [ ] Dashboard
- [ ] Review submission forms
- [ ] Goal tracking interface
- [ ] 1:1 meeting interface

### Phase 4: Advanced Features
- [ ] Reporting dashboards and analytics
- [ ] Gusto HRIS integration
- [ ] Google/Outlook Calendar integration
- [ ] Email notifications
- [ ] Mobile-responsive design
- [ ] Data export features

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

## Contributing

This is an internal project. See the implementation plan at `.claude/plans/idempotent-purring-papert.md`
