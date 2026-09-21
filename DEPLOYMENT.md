# DEPLOYMENT GUIDE — COALGUARD AI
**System:** CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  
**Tagline:** Safer Mines — Smarter Governance  
**Target Architecture:** Netlify (Frontend) + Render (Service/Backend) + Supabase PostgreSQL (Source of Truth) + Gemini API (AI Intelligence)

---

## 1. Overview of Architecture

```
                                  [ Browser Clients ]
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Netlify Edge / Next.js Web    │
                         └────────────────┬────────────────┘
                                          │ (API Calls / SSR)
                                          ▼
                         ┌─────────────────────────────────┐
                         │   Render Node Service / API     │
                         │   Health Check: GET /health     │
                         └───────┬─────────────────┬───────┘
                                 │                 │
              (PostgreSQL PostgREST / GoTrue)      │ (Grounded AI Queries)
                                 ▼                 ▼
        ┌────────────────────────────────┐  ┌──────────────┐
        │     Supabase PostgreSQL        │  │  Gemini API  │
        │ (12 Mines, RLS, Audit, Auth)   │  │ (3.8 Flash)  │
        └────────────────────────────────┘  └──────────────┘
```

---

## 2. Supabase Database & Auth Setup

### A. Instance Configuration
1. Project URL: `https://gsucaridjlhrpitrxynj.supabase.co`
2. Obtain **Project URL**, **Anon Public Key**, and **Service Role Secret Key** from Supabase Dashboard (`Project Settings` &rarr; `API`).
3. Ensure PostgreSQL version is 15+ with `pgcrypto` and `uuid-ossp` extensions enabled.

### B. Migrations Execution
Migrations are located under `supabase/migrations/`:
- `0001_extensions.sql` &rarr; Base schemas and timestamps
- `0002_organizations.sql` &rarr; Organizations, Subsidiaries, Regions, Mines
- `0003_rbac.sql` &rarr; Roles, Permissions, User Roles, Profiles, RLS functions
- `0004_compliance.sql` &rarr; Requirements, Categories, Compliance Records
- `0005_inspections.sql` &rarr; Inspections, Findings, Corrective Actions (CAPA)
- `0006_incidents_safety.sql` &rarr; Incidents, Hazards, Safety Observations
- `0007_contractors.sql` &rarr; Contractors, Workers, Contracts
- `0008_attendance_env_production_grievance.sql` &rarr; Telemetry & Production
- `0009_documents.sql` &rarr; Document attachments
- `0010_notifications_workflow_audit_ai.sql` &rarr; Audit logs, Risk Scores
- `0011_rls.sql` &rarr; Row-Level Security Policies
- `0012_ai_sessions_and_reporting.sql` &rarr; AI Sessions, Messages, Mine Metadata

### C. Seed Execution
Run the comprehensive idempotent seed to populate all 12 demo mines, 6 contractors, 32 workers, 26 incidents, 34 inspections, and telemetry:
```bash
node scripts/seed_12_mines_complete.js
```

---

## 3. Google Gemini AI Configuration

1. Obtain a Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
2. Set environment variable:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_ENABLED=true
   GEMINI_MODEL=gemini-flash-latest
   ```
3. Verified Model: `gemini-flash-latest` (connecting to Google Gemini 3.8 Flash with low temperature for deterministic analytical outputs).
4. Security: The Gemini key is strictly kept server-side in Node/Next.js API route handlers and is **never** exposed to the client browser.

---

## 4. Render Deployment (Backend Service)

1. Sign in to [Render](https://render.com/).
2. Click **New** &rarr; **Blueprint** and connect the CoalGuard AI GitHub repository.
3. Render will automatically detect `render.yaml`.
4. Configure required Secret Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
5. Build Command: `npm install && npm run build --workspace=apps/web`
6. Start Command: `npm run start --workspace=apps/web`
7. Health Check Path: `/health` (Responds with HTTP 200: `{"status":"ok"}`).

---

## 5. Netlify Deployment (Frontend)

1. Sign in to [Netlify](https://www.netlify.com/).
2. Click **Add new site** &rarr; **Import an existing project** &rarr; Connect GitHub.
3. Netlify automatically reads `netlify.toml`:
   - Build Command: `npm run build --workspace=apps/web`
   - Publish Directory: `apps/web/.next`
   - Plugin: `@netlify/plugin-nextjs`
4. Add Site Environment Variables in Netlify Site Configuration:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEMO_MODE=true`
   - `APP_ENV=production`
   - `DATA_MODE=demo`

---

## 6. Local Development Instructions

### Prerequisites
- Node.js v20.x or v22.x
- npm v10.x

### Steps
```bash
# 1. Clone repository
git clone https://github.com/your-org/sih26024-coal-governance.git
cd sih26024-coal-governance

# 2. Install workspace dependencies
npm install

# 3. Create .env.local in apps/web/
cp .env.example apps/web/.env.local
# Fill in real Supabase URL, Anon Key, Service Role Key, and Gemini API Key.

# 4. Run test suites
npm test

# 5. Start development server
npm run dev --workspace=apps/web
# Opens at http://localhost:3000
```

---

## 7. Verification & Health Monitoring

- **Uptime Health Check**: `GET /health` &rarr; `{"status":"ok","version":"1.0.0"}`
- **API Health Check**: `GET /api/health` &rarr; `{"status":"ok"}`
- **Database Row Count Verification**:
  ```bash
  node -e "require('dotenv').config({ path: 'apps/web/.env.local' }); const { createClient } = require('@supabase/supabase-js'); const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('mines').select('count').then(r => console.log('Mines count:', r.data));"
  ```
