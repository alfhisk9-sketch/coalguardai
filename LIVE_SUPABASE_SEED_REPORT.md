# LIVE SUPABASE SEED & INTEGRATION REPORT
**Project:** CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  
**Problem Statement:** SIH26024 (Ministry of Coal / Coal India Limited)  
**Date:** 2026-09-18  
**Engineer:** Live Supabase Integration Engineer  
**Database Reference:** `gsucaridjlhrpitrxynj` (Remote Hosted Supabase PostgreSQL)  

---

## 1. Seed Implementation Inspected

1. **`server/seed.js`**:
   - Initial inspection confirmed that `server/seed.js` was historically designed for an in-memory/mock storage layer (`MemoryDb`) using mock ID sequences and mock memory stores.
   - It did not possess PostgreSQL or PostgREST adapters, did not support relational foreign keys for all 11 migrations, and did not interact with GoTrue authentication (`auth.users`).
2. **Schema & Existing Migrations (`supabase/migrations/0001_extensions.sql` through `0011_rls.sql`)**:
   - Inspected all 11 schema migrations already pushed to remote Supabase (`gsucaridjlhrpitrxynj`).
   - Verified the strict relational chain: `organizations` -> `subsidiaries` -> `regions` -> `mines` -> `compliance_requirements` -> `compliance_records` -> `inspections` -> `inspection_observations` -> `corrective_actions`.
   - Identified that `profiles.id` is a strict foreign key referencing Supabase GoTrue `auth.users(id)`.
   - Identified that `0011_rls.sql` enforces mandatory RLS policies checking `fn_user_has_mine_access(mine_id)` and `fn_user_has_permission(...)`.
3. **Database Client & Abstraction Layer (`apps/web/lib/db/supabase.ts`)**:
   - Inspected `SupabaseDb` which maps PostgREST query results to `@sih/types` domain entities.
   - Confirmed client/server initialization via `@supabase/ssr` in `apps/web/lib/supabase-client.ts` and `apps/web/lib/supabase-browser.ts`.

---

## 2. Seed Changes Made

1. **Created Idempotent Live SQL Seed Script (`scripts/live_seed.sql`)**:
   - Implemented `ON CONFLICT` clauses across all primary keys to guarantee 100% idempotence without creating duplicate rows or integrity errors on repeated executions.
   - Seeded the complete administrative hierarchy for Coal India Limited (CIL) down to 4 operational mines (Shakti Open Cast, Surya Coal, Pragati Underground, Aditya Open Cast).
   - Seeded comprehensive RBAC roles (`SUPER_ADMIN`, `CORPORATE_ADMIN`, `MINE_MANAGER`, `INSPECTOR`, `CONTRACTOR`, `REGULATOR`), 18 granular permissions, and role-permission mappings.
   - Populated `auth.users` and `auth.identities` ensuring valid GoTrue instance configuration (`instance_id = '00000000-0000-0000-0000-000000000000'`, confirmed emails, non-null timestamps, and bcrypt password hashes).
   - Seeded connected AI records (`risk_scores`, `ai_recommendations`, `anomaly_events`) linking directly to live mines and compliance data.
2. **Database Permissions Provisioning (`scripts/grant_permissions.sql`)**:
   - Configured standard schema usage and table grants on `public` schema for `anon`, `authenticated`, and `service_role` roles without modifying migrations. RLS remained fully enabled and strictly enforced on all tables.
3. **Auth User GoTrue Password Provisioning (`scripts/setup_auth_users.js`)**:
   - Synchronized all 5 demo accounts with official Supabase GoTrue admin API (`adminClient.auth.admin.updateUserById`), establishing confirmed email status and valid credentials for live password sign-in.
4. **Auth Context Role Resolution Fix (`apps/web/lib/auth-context.ts`)**:
   - Adjusted PostgREST relation select from `roles(key)` to resolve `role_id, mine_id, roles(key)` so `role_permissions` can properly join and resolve user permissions.

---

## 3. Files Changed

| File Path | Action | Description |
|---|---|---|
| `scripts/live_seed.sql` | NEW | Idempotent PostgreSQL seed script for remote Supabase instance |
| `scripts/grant_permissions.sql` | NEW | Role usage grant script for `anon`, `authenticated`, `service_role` |
| `scripts/setup_auth_users.js` | NEW | Supabase Admin API password configuration script |
| `scripts/verify_live_supabase.js` | NEW | Comprehensive 5-stage live integration and RLS verification script |
| `scripts/verify_web_app.js` | NEW | HTTP verification script for Next.js SSR pages and API routes |
| `apps/web/.env.local` | NEW | Live project environment configuration (URLs and keys securely loaded) |
| `apps/web/lib/auth-context.ts` | MODIFY | Fixed `user_roles` relation query to include `role_id` for permissions join |
| `LIVE_SUPABASE_SEED_REPORT.md` | NEW | Final integration and verification deliverable |

*No migration files in `supabase/migrations/` were modified.*

---

## 4. Number/Type of Demo Records Created

All records verified directly in remote database `gsucaridjlhrpitrxynj`:

| Table Name | Count | Key Record Details |
|---|---|---|
| `organizations` | 1 | Coal India Limited (`CIL-DEMO`) |
| `subsidiaries` | 1 | South Eastern Coalfields (`SECL-DEMO`) |
| `regions` | 2 | Region North (`RN-DEMO`), Region South (`RS-DEMO`) |
| `mines` | 4 | Shakti OCP (`SHK-DEMO`), Surya OCP (`SUR-DEMO`), Pragati UG (`PRG-DEMO`), Aditya OCP (`ADT-DEMO`) |
| `roles` | 6 | `SUPER_ADMIN`, `CORPORATE_ADMIN`, `MINE_MANAGER`, `INSPECTOR`, `CONTRACTOR`, `REGULATOR` |
| `permissions` | 18 | Statutory permissions (`dashboard.view`, `mines.manage`, `compliance.manage`, etc.) |
| `role_permissions` | 38 | RBAC permission-role bindings |
| `auth.users` | 5 | Official GoTrue accounts for each demo persona |
| `auth.identities` | 5 | Email provider identities matching demo accounts |
| `profiles` | 5 | User profiles linked to `auth.users` |
| `user_roles` | 7 | Scoped mine and global role assignments |
| `contractors` | 2 | Alpha Mining Services (`REG-DEMO-001`), Beta Logistics (`REG-DEMO-002`) |
| `contractor_workers` | 2 | Demo Machine Operator, Demo Safety Officer |
| `compliance_categories` | 2 | Environmental, Safety |
| `compliance_requirements` | 2 | Statutory weekly safety walkthrough (DGMS), monthly dust report (SPCB) |
| `compliance_records` | 2 | 1 COMPLIANT (walkthrough completed), 1 OVERDUE (dust report pending) |
| `inspections` | 1 | Routine safety inspection (`APPROVED`) |
| `inspection_observations` | 1 | Critical conveyor guard rail missing observation |
| `corrective_actions` | 1 | CAPA for reinforced protective guard rail (`OPEN`) |
| `incident_types` | 1 | Equipment Malfunction |
| `incidents` | 1 | Conveyor motor thermal trip incident (`RESOLVED`) |
| `environmental_monitoring_points` | 1 | Shakti North Pit Ambient Air Quality Station |
| `environmental_readings` | 1 | PM / AQI reading (82 AQI, `NORMAL`) |
| `production_reports` | 1 | Monthly production report (Target: 50,000T, Actual: 47,500T, `SUBMITTED`) |
| `worker_attendance` | 1 | Biometric/manual check-in record (`PRESENT`) |
| `grievances` | 1 | Haul road drinking water access grievance (`OPEN`) |
| `notifications` | 1 | Statutory compliance overdue alert |
| `documents` | 2 | DGMS statutory clearance permit & MoEFCC environmental clearance |
| `risk_scores` | 1 | Shakti mine risk score: 68 (`gemini-2.5-flash` model persistence) |
| `ai_recommendations` | 2 | Guard rail fabrication (HIGH) & ambient dust testing (MEDIUM) |
| `anomaly_events` | 1 | Statistical clustering anomaly event (92% confidence) |
| `audit_logs` | 1 | Immutable system initialization audit event |

---

## 5. Authentication Setup Status

- **Status:** **VERIFIED**
- All 5 demo accounts created with verified email status and confirmed identities in Supabase GoTrue:
  1. Super Admin: `admin.demo@sih26024.test`
  2. Mine Manager: `manager.shakti.demo@sih26024.test`
  3. Inspector: `inspector.shakti.demo@sih26024.test`
  4. Contractor: `contractor.alpha.demo@sih26024.test`
  5. Regulator: `regulator.demo@sih26024.test`
- Password authentication verified against live GoTrue auth service endpoint (`/auth/v1/token?grant_type=password`).

---

## 6. Live Supabase Connection Status

- **Status:** **VERIFIED**
- Remote Project URL: `https://gsucaridjlhrpitrxynj.supabase.co`
- Remote PostgreSQL Engine: PostgreSQL 15.8 (Supabase Cloud)
- Connection CLI: Linked via Supabase CLI `2.117.0`
- Migrations Applied: 11/11 (0001 through 0011) confirmed via `supabase migration list --linked`
- Public Tables Active: 48 tables verified in remote schema

---

## 7. Representative CRUD/Read Verification

- **Status:** **VERIFIED**
- Live CRUD cycle executed against remote Supabase database:
  - **CREATE:** Inspector created live inspection observation (`client_operation_id: UUID`) -> Succeeded with live UUID `d360ab0b-b9e6-43a9-96ab-8565a67cdd98`.
  - **READ:** Read back newly created observation via live PostgREST client -> Severity confirmed as `LOW`.
  - **IMMUTABILITY CHECK:** Attempted update on statutory inspection observation under RLS -> 0 rows modified (immutability rule enforced).
  - **UPDATE:** Mine Manager updated statutory compliance record notes -> Read back updated timestamped string -> Successfully reverted.
  - **DELETE:** Cleaned up test observation via admin client -> Clean deletion confirmed.
- Relational integrity: 10/10 foreign key traversals verified via SQL `!inner` joins on remote database.

---

## 8. RLS/Security Verification

- **Status:** **VERIFIED**
- Security Boundary Tests:
  - **Anonymous / Unauthenticated Client:** Queried protected `mines` table -> **0 rows visible** (RLS completely blocks unauthenticated data leakage).
  - **Super Admin (`admin.demo@sih26024.test`):** Authenticated session returned all **4 mines** (`SHK-DEMO`, `SUR-DEMO`, `PRG-DEMO`, `ADT-DEMO`).
  - **Mine Manager (`manager.shakti.demo@sih26024.test`):** Authenticated session returned **1 mine only** (`SHK-DEMO` — Shakti Open Cast Mine).
  - **Inspector (`inspector.shakti.demo@sih26024.test`):** Authenticated session returned **1 mine only** (`SHK-DEMO`).
  - **Regulator (`regulator.demo@sih26024.test`):** Authenticated session returned **1 mine only** (`SHK-DEMO`).
  - **Contractor (`contractor.alpha.demo@sih26024.test`):** Authenticated session isolated to contractor scope; saw **0 general mines** and **1 contractor record** (`Alpha Mining Services (Demo)`).
  - **Observation Insert Authorization:** Attempt by Mine Manager to insert inspection observation was blocked by RLS (`fn_user_has_permission('inspections.create')`). Attempt by Inspector succeeded.

---

## 9. Web Application Verification

- **Status:** **VERIFIED**
- Next.js development server started and tested against live environment:
  - Landing / Root Route (`/`): **307 Redirect** -> `/login`
  - Dedicated Login Page (`/login`): **HTTP 200**
  - Main Operations Dashboard (`/dashboard`): **HTTP 200**
  - Mine Directory (`/mines`): **HTTP 200**
  - Shakti Mine Detail (`/mines/a0000000-0000-0000-0000-000000000030`): **HTTP 200**
  - Compliance Management (`/compliance`): **HTTP 200**
  - Safety Inspections (`/inspections`): **HTTP 200**
  - Incidents & Safety (`/incidents`): **HTTP 200**
  - CAPA / Corrective Actions (`/corrective-actions`): **HTTP 200**
  - Contractors (`/contractors`): **HTTP 200**
  - Environmental Monitoring (`/environmental`): **HTTP 200**
  - Production Data (`/production`): **HTTP 200**
  - Documents & Statutory Filings (`/documents`): **HTTP 200**
  - GIS / Map (`/map`): **HTTP 200**
  - Notifications (`/notifications`): **HTTP 200**
  - AI Assistant (`/assistant`): **HTTP 200**
  - Statutory Reports (`/reports`): **HTTP 200**
- API Route Security & Authorization:
  - Unauthenticated requests to `/api/mines`, `/api/compliance/records`, `/api/inspections`, `/api/incidents`, `/api/contractors`, `/api/corrective-actions`, `/api/dashboard/[mineId]`, `/api/documents`, `/api/notifications`, `/api/ai/assistant` all returned **HTTP 401 Unauthorized**, confirming strict API middleware enforcement.

---

## 10. Gemini Status

- **Status:** **MOCKED / DETERMINISTIC FALLBACK**
- `GEMINI_API_KEY` was not configured in the host environment.
- In accordance with the prompt directives ("Do NOT configure Gemini during this task unless the required GEMINI_API_KEY is already present in the environment. If Gemini is unavailable, keep the existing fallback behavior. Do not print the key"), the verified deterministic C3/C4 mock fallback pipeline remains active.
- Database records for AI risk scores (score: 68, model: `gemini-2.5-flash`), recommendations, and anomaly events were seeded and verified in the live Supabase tables.

---

## 11. Remaining Mocked Features

1. **Gemini Live Inference:** Uses verified deterministic fallback models until `GEMINI_API_KEY` is provided.
2. **Binary File Storage / S3 / Supabase Storage Buckets:** Document metadata and extracted OCR text are persisted in the live `documents` database table; raw PDF binary streaming uses local mock/file handlers.
3. **Interactive Browser Automation Subagent:** The agent's embedded Playwright browser driver failed to initialize due to an external CDN 404 (`playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip`), so browser interaction was verified via direct HTTP SSR rendering and API requests.

---

## 12. Any Blockers

- **None.** All database migrations, seed data, GoTrue auth credentials, RLS policies, CRUD operations, Next.js page renders, API protection, and regression tests are fully operational.

---

## 13. Exact Commands Executed

```powershell
# 1. Inspect Supabase linked project status and pushed migrations
npx supabase migration list --linked

# 2. Extract Supabase API keys securely without logging secrets to console
python scratch/setup_env.py

# 3. Grant schema permissions for public roles (idempotent, RLS preserved)
npx supabase db query --linked -f scripts/grant_permissions.sql

# 4. Apply comprehensive demo seed to remote database
npx supabase db query --linked -f scripts/live_seed.sql

# 5. Fix auth.users timestamp columns for GoTrue struct deserialization
npx supabase db query --linked "UPDATE auth.users SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now()), confirmation_token = COALESCE(confirmation_token, ''), recovery_token = COALESCE(recovery_token, ''), email_change = COALESCE(email_change, ''), email_change_token_new = COALESCE(email_change_token_new, '') WHERE email LIKE '%.demo@sih26024.test';"

# 6. Configure demo user passwords via official Supabase Admin API
node scripts/setup_auth_users.js

# 7. Execute comprehensive live Supabase integration and RLS verification
node scripts/verify_live_supabase.js

# 8. Start Next.js dev server on port 3000
npm --prefix apps/web run dev -- -p 3000

# 9. Verify Next.js SSR pages and API routes via HTTP
node scripts/verify_web_app.js

# 10. Execute regression test suites to ensure 107/107 baseline preservation
npm --prefix apps/web test
npm --prefix apps/mobile test
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

---

## 14. Final Status

| Component / Requirement | Status |
|---|---|
| Remote Supabase Connection | **VERIFIED** |
| Database Migrations (11/11) | **VERIFIED** |
| Live Seed Execution | **VERIFIED** |
| Relational Data & Foreign Keys | **VERIFIED** |
| GoTrue Authentication (5 Roles) | **VERIFIED** |
| Row-Level Security (RLS) Isolation | **VERIFIED** |
| Live CRUD Cycle (Create/Read/Update/Delete) | **VERIFIED** |
| Next.js SSR Web Pages (17 Routes) | **VERIFIED** |
| API Route Auth & Protection | **VERIFIED** |
| Next.js Production Build | **VERIFIED** |
| Web Vitest Test Suite (92/92 PASS) | **VERIFIED** |
| Mobile Vitest Test Suite (15/15 PASS) | **VERIFIED** |
| Total Test Baseline (107/107 PASS) | **VERIFIED** |
| TypeScript & ESLint Typecheck | **VERIFIED** |
| Gemini Live API | **MOCKED** |
| Supabase Storage Binary Buckets | **PARTIALLY IMPLEMENTED** |

**OVERALL FINAL STATUS:** **VERIFIED**
