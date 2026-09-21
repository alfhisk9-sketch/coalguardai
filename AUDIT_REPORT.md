# AUDIT REPORT — COALGUARD AI
**System:** CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  
**Tagline:** Safer Mines — Smarter Governance  
**Date:** 2026-09-21  
**Audit Scope:** Full repository audit (Frontend, Backend, Database, AI, GIS, Auth, Security, DevOps)

---

## 1. Executive Summary

CoalGuard AI has a solid foundational monorepo structure built with Next.js 14 App Router, TypeScript, Supabase PostgreSQL, and Leaflet GIS. However, it currently operates with:
1. **Limited Fictional Dataset**: Only 4 demonstration mines (`SHK-DEMO`, `SUR-DEMO`, `PRG-DEMO`, `ADT-DEMO`) instead of an enterprise portfolio of 12 mines across Indian coalfields. Single-digit counts of incidents (1), inspections (2), workers (2), and environmental points (1).
2. **Prototype Aesthetics & Branding**: Uses an SVG monogram ("CG") instead of the official CoalGuard AI brand identity (the dark navy "C" emblem enclosing a haul truck, coal mountain, and gold circuit nodes with the official typography and tagline). Lacks enterprise visual polish, high-density dashboard layouts, and realistic KPIs.
3. **AI Assistant Degradation**: Queries defaulted to a deterministic stub that returned repetitive strings ("Under authorized scope...") because the configured Gemini model (`gemini-3.6-flash` / `gemini-2.5-flash`) was not resolving cleanly to active endpoints, falling back to stub logic without full Supabase grounding.
4. **Environment & Data State**: Hardcoded yellow warning banner ("Demo mode — fictional seeded data...") without a formal `APP_ENV` (development/staging/production) and `DATA_MODE` (demo/live) architecture.
5. **Deployment Configs Missing**: `render.yaml`, `netlify.toml`, and dedicated `/health` endpoints are absent.

All 99 existing unit/integration tests pass, and the Next.js production build succeeds cleanly (48/48 routes). The codebase is well-architected for a seamless upgrade.

---

## 2. Technical Stack Audit

| Layer | Current Implementation | Target Production State |
|---|---|---|
| **Monorepo** | NPM Workspaces (`apps/*`, `packages/*`) | Preserve monorepo; streamline scripts |
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React, Recharts, React-Leaflet | Next.js 14 SSR/Client + Netlify edge/Node deployment, Tailwind enterprise palette |
| **Backend/API** | Next.js App Router Route Handlers (`apps/web/app/api/**`) | Next.js Serverless/Node API endpoints with CORS, Auth, RBAC middleware |
| **Database** | Remote Supabase PostgreSQL (`gsucaridjlhrpitrxynj`) | Remote Supabase PostgreSQL (Source of Truth, RLS, 12-mine deterministic seed) |
| **Auth & RBAC** | Supabase GoTrue Auth + profiles + user_roles + RLS functions | Supabase GoTrue Auth, session persistence, role-aware routing, audit logging |
| **AI Intelligence** | `@google/genai` (SDK v2.23.0) with Gemini fallback | Live grounded Gemini (`gemini-flash-latest` / `gemini-3.8-flash`) + DB grounding |
| **GIS / Maps** | Leaflet 1.9 + React-Leaflet 4.2 | Interactive Leaflet GIS, 12 clusterable mines, custom risk markers, popups |
| **Deployment** | Unconfigured | Render (Backend/Node/Health), Netlify (Frontend), Supabase (DB/Auth) |

---

## 3. Database Schema & Tables Audit

Inspected 11 migrations in `supabase/migrations/`:
1. `0001_extensions.sql`: `uuid-ossp`, `pgcrypto`, `fn_set_updated_at`
2. `0002_organizations.sql`: `organizations`, `subsidiaries`, `regions`, `mines`
3. `0003_rbac.sql`: `roles`, `permissions`, `role_permissions`, `profiles`, `user_roles`, RLS helper functions
4. `0004_compliance.sql`: `compliance_categories`, `compliance_requirements`, `compliance_records`
5. `0005_inspections.sql`: `inspection_templates`, `inspections`, `inspection_items`, `inspection_observations`, `corrective_actions`
6. `0006_incidents_safety.sql`: `incident_types`, `incidents`, `incident_evidence`, `safety_observations`, `hazards`
7. `0007_contractors.sql`: `contractors`, `contractor_contracts`, `contractor_workers`, `contractor_documents`
8. `0008_attendance_env_production_grievance.sql`: `worker_attendance`, `environmental_monitoring_points`, `environmental_readings`, `production_reports`, `operational_indicators`, `grievances`, `grievance_evidence`
9. `0009_documents.sql`: `documents`, `document_versions`
10. `0010_notifications_workflow_audit_ai.sql`: `notifications`, `notification_rules`, `tasks`, `approvals`, `workflow_events`, `audit_logs`, `risk_scores`, `anomaly_events`, `ai_analysis_results`, `ai_recommendations`
11. `0011_rls.sql`: Row Level Security policies across all tables

### Missing Database Entities:
- `ai_sessions` and `ai_messages` for conversation history tracking.
- Columns for mine operator, state, district, target production, worker count, environmental status on `mines` or via relational views/attributes.
- Expanded seed records matching Phase 25 specifications.

---

## 4. Current Record Counts in Live Supabase

| Table | Current Count | Target Seed Count | Status |
|---|---|---|---|
| `mines` | 4 | 12 | Needs 8 additional mines with codes & coords |
| `contractors` | 2 | 6+ | Needs 4+ additional contractor firms |
| `contractor_workers` | 2 | 30+ | Needs 28+ fictional workers across departments |
| `incidents` | 1 | 25+ | Needs 24+ incidents across severities & statuses |
| `inspections` | 2 | 30+ | Needs 28+ inspections (scheduled, overdue, completed) |
| `inspection_observations` | 1 | 30+ | Needs 29+ observations with severity levels |
| `corrective_actions` | 1 | 25+ | Needs 24+ CAPA records with deadlines & owners |
| `environmental_monitoring_points` | 1 | 12+ | Needs 11+ points (AQI, Dust, Water, Noise, Land) |
| `environmental_readings` | 1 | 50+ | Needs historical series with NORMAL/WARNING/CRITICAL |
| `production_reports` | 1 | 24+ | Needs monthly target vs actual production records |
| `worker_attendance` | 1 | 60+ | Needs shift-level attendance logs |
| `grievances` | 2 | 10+ | Needs realistic worker/community grievances |
| `notifications` | 1 | 15+ | Needs role-specific alerts and statutory reminders |

---

## 5. Existing Bugs & Architectural Gaps

1. **AI Grounding & Hallucination Defense**:
   - The assistant service in `lib/ai/gemini.ts` failed back to `StubAIService` when `GEMINI_MODEL` was configured to non-existent or deprecated model endpoints.
   - The stub returned identical canned text ("Under authorized scope for ...") rather than synthesizing Supabase metrics.
   - Grounding query was limited to a simple prompt rather than structured tool/DB retrieval for specific queries like "Which mines are high risk?" or "Show open incidents".
2. **Branding Inconsistency**:
   - The user provided the official brand logo (Dark Navy "C", Haul Truck, Mountain, Gold Circuit). The app currently uses an inline SVG shield with letters "CG".
   - Browser title is long and does not match the required: `CoalGuard AI — Safer Mines, Smarter Governance`.
   - Favicon is a generic SVG.
3. **Prototype Warning Banner**:
   - `components/shell/app-shell.tsx` renders a raw yellow banner stating "Demo mode — fictional seeded data, local demo session. Not a live government system." This needs to be transformed into a sleek, professional `DEMO ENVIRONMENT` indicator in demo mode and cleanly hidden in live production mode.
4. **Mines Page Directory**:
   - Currently shows a simple table without top aggregate KPI summary cards (Total Mines, Active, High Risk, Under Inspection, Non-Compliant), district/state filtering, or direct quick-actions (View, Edit, Inspect, View Map).
5. **GIS / Map Upgrades**:
   - Map only shows 4 mines; needs full 12 mines plotted across Indian coalfields (Chhattisgarh, Jharkhand, Odisha, Madhya Pradesh, Telangana, Maharashtra).
   - Needs layer toggles (mines, incidents, inspections), risk-colored markers, and rich interactive modal popups with action buttons.
6. **Deployment Files**:
   - Missing `render.yaml` and `netlify.toml`.
   - Missing `/health` endpoint for Render uptime checks.
   - Missing CORS configuration middleware for production vs local.

---

## 6. Recommended Implementation Phases

1. **Phase 1 & 2: Branding & Design System**
   - Place official CoalGuard AI logo in `public/branding/`.
   - Update `BrandLogo`, favicon, browser titles, login page, and dashboard header.
   - Enforce palette: Deep navy (#0B192C / #0F172A), Gold (#E5A93C / #F59E0B), Emerald compliant (#10B981), Amber warning (#F59E0B), Orange high risk (#EA580C), Red critical (#EF4444), Slate & white neutral.
2. **Phase 3: Data-State System**
   - Implement `APP_ENV` (`development`, `staging`, `production`) and `DATA_MODE` (`demo`, `live`).
   - Add subtle enterprise `DEMO ENVIRONMENT` badge; remove amateur warnings.
3. **Phase 4 & 24: Supabase Migrations**
   - Migration `0012_ai_sessions_and_reporting.sql` for `ai_sessions`, `ai_messages`, and enhanced mine metadata.
4. **Phase 6 & 25: Comprehensive Deterministic Seed Data**
   - Generate idempotent SQL seed (`supabase/seed/seed.sql` & `scripts/live_seed.sql`):
     - 12 fictional mines (Shakti, Vindhya, Eastern Ridge, Central Basin, Satpura, Narmada Valley, Deccan Coal, Korba Ridge, Damodar, Mahanadi, Godavari Basin, Kalinga) with demo codes (`SHK-DEMO`, `VND-DEMO`, etc.) and realistic coordinates.
     - 6+ contractors, 30+ workers, 25+ incidents, 30+ inspections, 30+ observations, 25+ CAPAs, 12+ environmental monitoring series, monthly production records.
   - Run seed against remote Supabase database.
5. **Phase 7 & 8: GIS Map & Mines Directory Upgrades**
   - Upgrade GIS map with all 12 mines, risk-color markers, clustering, layer toggles, and rich popups with action buttons.
   - Upgrade Mines page with enterprise KPI cards, comprehensive filters, and action links.
6. **Phase 9 - 15: Enterprise Module Polish**
   - Dashboard KPIs, incident tracking, inspections detail & CAPA flow, workforce directory, production target vs actual, and environmental monitoring.
7. **Phase 16 & 17: Grounded AI Assistant**
   - Configure Gemini model to `gemini-flash-latest` (supported and verified).
   - Implement grounded database querying: query Supabase for high-risk mines, open incidents, overdue inspections, and compliance health.
   - Enhanced Chat UX: suggested prompts, conversation history, clear chat, retry, copy response, source citation indicators.
8. **Phase 26 - 32: API, Security, DevOps & Deployment**
   - Health check endpoint `GET /health` -> `{"status":"ok"}`.
   - Create `render.yaml` and `netlify.toml`.
   - Review secrets, update `.env.example`, create `DEPLOYMENT.md`.
9. **Phase 23, 33 & 34: Testing & Browser Verification**
   - Run automated test suites and Next.js production build.
   - Perform end-to-end browser walkthrough across all roles and pages.
   - Generate `QA_REPORT.md` and `FINAL_QA_REPORT.md`.
