# Beacon - Project Context for Claude

## About the User

Jacob is the product owner but **not technical**. He relies on Claude for all technical implementation details, code changes, debugging, and architecture decisions. Jacob provides:
- UI/UX feedback and preferences
- Business requirements and feature requests
- Testing and QA from a user perspective
- Final approval on changes

**Communication style:** Keep explanations simple and non-technical when possible. When technical details are necessary, provide clear step-by-step instructions. Don't ask Jacob to write code or make technical decisions - just do it and explain what you did.

---

## Project Overview

**Beacon** is a performance management SaaS platform for HR teams. It helps organizations manage:
- Employee performance reviews
- Goal setting and tracking
- 1:1 meetings between managers and reports
- Development plans
- Peer feedback

**Business Model:** Per-seat subscription pricing
- Monthly: $7/seat/month
- Yearly: $60/seat/year (saves 29%)

**First Customer:** Homestead (Jacob's organization)

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Inline styles (no CSS framework)
- **Icons:** Lucide React
- **Hosting:** Cloudflare Pages

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (profile pictures, transcripts)
- **Edge Functions:** Supabase Edge Functions (Deno runtime)
- **Realtime:** Supabase Realtime (for future features)

### Payments
- **Provider:** Stripe
- **Model:** Subscription with quantity (seats)
- **Webhooks:** Handled by Supabase Edge Function

### Legacy (Not in Use)
- `backend/` folder contains old Express.js + Prisma code (kept as reference, not deployed)

---

## Directory Structure

```
beacon/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   │   ├── AdminBillingTab.tsx    # Stripe billing UI
│   │   │   │   └── InviteUserModal.tsx    # User invitation modal
│   │   │   ├── Layout.tsx       # Main app layout with navigation
│   │   │   └── OnboardingChecklist.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.tsx      # Authentication hook (Supabase)
│   │   ├── lib/
│   │   │   ├── api.ts           # API layer (Supabase queries)
│   │   │   ├── supabase.ts      # Supabase client initialization
│   │   │   └── database.types.ts # Generated TypeScript types
│   │   ├── pages/               # Route pages
│   │   │   ├── Admin.tsx        # Organization admin settings
│   │   │   ├── PlatformAdmin.tsx # Super admin (all orgs view)
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx     # New organization signup
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Reviews.tsx
│   │   │   ├── Goals.tsx
│   │   │   ├── OneOnOnes.tsx
│   │   │   └── ...
│   │   └── App.tsx              # Router and app entry
│   ├── dist/                    # Build output (deployed to Cloudflare)
│   └── package.json
│
├── supabase/                    # Supabase configuration
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── create-checkout-session/   # Stripe checkout
│   │   ├── customer-portal/           # Stripe billing portal
│   │   ├── stripe-webhook/            # Stripe event handler
│   │   ├── create-organization/       # New org signup
│   │   └── invite-user/               # Email invitations
│   ├── migrations/              # SQL schema migrations
│   │   ├── 20241227000001_organizations.sql
│   │   ├── 20241227000002_users.sql
│   │   ├── 20241227000003_departments.sql
│   │   ├── 20241227000004_reviews.sql
│   │   ├── 20241227000005_goals.sql
│   │   ├── 20241227000006_one_on_ones.sql
│   │   ├── 20241227000007_development.sql
│   │   ├── 20241227000008_admin.sql
│   │   ├── 20241227000009_rls_policies.sql
│   │   ├── 20241227000010_storage.sql
│   │   └── 20241228000001_platform_admins.sql
│   └── config.toml              # Supabase project config
│
├── backend/                     # LEGACY - Not deployed
│   └── (Express.js + Prisma - kept for reference only)
│
└── CLAUDE.md                    # This file
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Companies/tenants using Beacon |
| `users` | Employees within organizations |
| `departments` | Org structure with hierarchy |
| `review_cycles` | Performance review periods |
| `reviews` | Individual performance reviews |
| `peer_feedback` | 360 feedback on reviews |
| `goals` | Employee goals |
| `goal_templates` | Reusable goal templates |
| `one_on_ones` | 1:1 meeting records |
| `development_plans` | Career development plans |
| `audit_logs` | Activity logging |
| `invitations` | Pending user invites |
| `platform_admins` | Super admins (cross-org access) |

### Key Fields on Organizations
```sql
stripe_customer_id      -- Stripe customer ID
stripe_subscription_id  -- Active subscription ID
subscription_status     -- 'active', 'trialing', 'past_due', 'canceled', 'inactive'
subscription_tier       -- 'free', 'monthly', 'yearly'
```

### User Roles
- `SUPER_ADMIN` - Full org access, can manage billing
- `HR_ADMIN` - HR functions, can manage billing
- `MANAGER` - Can manage direct reports
- `EMPLOYEE` - Basic access

### Row Level Security (RLS)
All tables use RLS to ensure users only see data from their own organization. Key function:
```sql
get_user_org_id() -- Returns current user's organization_id
is_platform_admin() -- Checks if user is a platform super admin
```

---

## Environment Variables

### Frontend (Cloudflare Pages)
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Edge Functions (Secrets)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Supabase (Automatic)
```
SUPABASE_URL           -- Auto-provided
SUPABASE_ANON_KEY      -- Auto-provided
SUPABASE_SERVICE_ROLE_KEY -- Auto-provided
```

---

## Stripe Configuration

### Products & Prices
- **Product:** Beacon Subscription
- **Monthly Price ID:** `price_1SjRAACwCNHtAVIQ9mD1IPEC` ($7/seat/month)
- **Yearly Price ID:** `price_1SjRAACwCNHtAVIQVacO8Dbm` ($60/seat/year)

### Webhook Events Handled
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

### Webhook URL
```
https://bunpyytlgpdcpcfhjjut.supabase.co/functions/v1/stripe-webhook
```

---

## Deployment

### Frontend (Cloudflare Pages)
- **Repo:** Connected to GitHub `main` branch
- **Build command:** `cd frontend && npm run build`
- **Output directory:** `frontend/dist`
- **Auto-deploys:** On push to `main`

### Edge Functions (Supabase)
Deploy via CLI:
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

### Database Migrations
Run in Supabase SQL Editor or via CLI:
```bash
npx supabase db push
```

---

## Common Tasks

### Regenerate TypeScript Types
```bash
npx supabase gen types typescript --project-id bunpyytlgpdcpcfhjjut > frontend/src/lib/database.types.ts
```

### Deploy All Edge Functions
```bash
npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy customer-portal --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-organization --no-verify-jwt
npx supabase functions deploy invite-user --no-verify-jwt
```

### Build and Deploy Frontend
```bash
cd frontend && npm run build
git add -A && git commit -m "message" && git push
# Cloudflare auto-deploys from main branch
```

---

## Known Issues / TODOs

- [ ] Email sending for invitations (needs Resend API key)
- [ ] Google Calendar integration (OAuth setup needed)
- [ ] File uploads for transcripts
- [ ] Real-time notifications

---

## Git Workflow

- `main` - Production branch, auto-deploys to Cloudflare
- Feature branches - Create for major changes, merge to main when ready

Always commit with descriptive messages and the Claude Code signature.
