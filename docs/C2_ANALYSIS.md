# C2_ANALYSIS.md
**Owner:** Claude Account 2 (Frontend + Mobile)
**Phase:** C2-P0 — Repository Analysis
**Basis:** `docs/HANDOFF.md` "IMPLEMENTATION STATUS" (authoritative) + direct inspection of `apps/web`, `packages/*`, `supabase/*`.

## 1. What Already Exists (verified by reading, not by running — no live Supabase/Postgres in this environment)

- **No frontend exists yet.** `apps/web/app/` contains only `api/*` route handlers. There is no `layout.tsx`, `page.tsx`, `globals.css`, Tailwind config, or `next.config.js`. `apps/mobile/` does not exist. This is a greenfield build on a real backend, not a redesign.
- **11 core modules** (mines, compliance requirements/records, inspections, observations, corrective actions, incidents, contractors, documents, notifications, audit, dashboard) are implemented through a shared `Db` interface (`lib/db/types.ts`) with both an in-memory test double and an unverified-live `SupabaseDb`, and are contract-tested (43 tests).
- **4 lighter-tier modules** (attendance, environmental readings, production reports, grievances) exist as **POST-only** route handlers that write directly to Supabase, bypassing the `Db`/service abstraction. **There are no GET/list endpoints for any of these four** — confirmed by reading all four route files. The frontend cannot list/browse this data from the backend as shipped.
- `packages/types` does not yet define DTOs for `Attendance`, `EnvironmentalReading`, `ProductionReport`, `Grievance`, `Document`, `Notification`, `Worker`, or `AuditEntry` as public types — `DocumentRecord`, `NotificationRecord`, and `AuditEntry` exist only inside `apps/web/lib/db/types.ts` (not exported from `@sih/types`), and attendance/environmental/production/grievance have no types at all outside their Zod create-schemas in `@sih/validation`.
- `GET /api/dashboard/[mineId]` returns a single, minimal `MineDashboard` (`complianceScore`, `overdueCompliance`, `openInspections`, `criticalObservations` — hardcoded to 0, `openIncidents`) for **one mine at a time**. There is no org-wide/corporate aggregate endpoint, no role-specific dashboard endpoint (`API.md` describes `/api/dashboard/:role` but the implemented route is `/api/dashboard/:mineId`), no `/api/compliance/summary`, and no `/api/reports` or `/api/ai/*` routes exist yet.
- Auth (`lib/auth-context.ts`) and the live Supabase DB layer (`lib/db/supabase.ts`) are written to match the schema but are explicitly flagged **NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION** (no live Supabase project in this environment).

## 2. API Routes Available (for the API client layer)

Full CRUD-ish, `Db`-backed, contract-tested: `/api/mines`, `/api/compliance/requirements`, `/api/compliance/records[/:id]`, `/api/inspections[/:id/observations][/:id/approve]`, `/api/corrective-actions[/:id/verify]`, `/api/incidents`, `/api/contractors[/:id/workers]`, `/api/documents`, `/api/notifications[/:id]`, `/api/audit`, `/api/dashboard/:mineId`.

POST-only, unlisted, untested: `/api/attendance`, `/api/environmental/readings`, `/api/production/reports`, `/api/grievances`.

## 3. Types & Validation Available
`@sih/types` (DTOs + `AuthContext` + `AIService`/`OCRService` interfaces), `@sih/validation` (Zod create/update schemas for all 11+4 modules), `@sih/config` (role/permission keys, `ROLE_PERMISSION_MATRIX`, offline-syncable entity list). All are stable and will be imported as-is — nothing redefined.

## 4. Frontend Gaps (what C2 must build, essentially everything)
App shell, auth UI, role-based navigation/layout for 6 roles, typed API client (`lib/api/*`), reusable loading/error/empty-state components, all 18 module UIs, 6 role dashboards, GIS map (Leaflet), forms with Zod validation, demo-mode data labeling, and the entire Expo mobile app (auth, inspection workflow, GPS, photo capture, offline queue/sync UI).

## 5. Mobile Gaps
Entirely unbuilt. Backend sync contract (`clientOperationId`/`clientCreatedAt`/`syncStatus`, idempotent retry) is implemented and tested server-side for inspections/observations/incidents; attendance has the same DB columns but sits on the untested lighter tier. Local storage, queueing, retry, and connectivity detection are 100% Account 2 scope, not started.

## 6. Integration Risks (for HANDOFF, not blocking C2 start)
1. **No GET endpoints for attendance/environmental/production/grievances.** C2 will build these four module UIs against typed mock adapters (matching the real Zod input shapes) until C1 adds list endpoints — flagged here as required, not silently worked around with a shadow schema.
2. **No multi-mine/role-aggregate dashboard endpoint.** Corporate/Regulator dashboards (which need cross-mine totals) will be composed client-side by calling `/api/mines` + per-mine `/api/dashboard/:mineId` in parallel, or clearly marked as pending a real aggregate endpoint where that's impractical (e.g., org-wide trend charts). This is a UI composition choice, not a backend contract change, so it doesn't require an API.md edit.
3. **Auth is unverified live.** No Supabase project exists in this build environment, so the auth UI and API client will be built correctly against the documented contract but cannot be end-to-end tested against a live session here. This will be called out plainly in `C2_HANDOFF.md`, not glossed over.
4. **`Document`/`Notification`/`Audit` types live in `apps/web/lib/db/types.ts`, not `@sih/types`.** C2 will declare local, frontend-side view types for these (not new backend DTOs) to avoid importing server-only `lib/db` paths into client components. This is additive, not a redefinition of any contract.

None of the above require a backend contract change to unblock C2-P1/P2/P3 start — they only affect the 4 lighter-tier module UIs and the corporate/regulator dashboards, which will proceed against typed mocks per `ARCHITECTURE.md` §4b.

## 7. Plan
Proceed per the phase order in the C2 brief: P1 (web foundation: shell, nav, auth UI, API client, shared states) → P2 (six dashboards) → P3 (core modules) → P4 (supporting modules) → P5 (mobile) → P6 (polish) → P7 (integration). This response begins and delivers a working P1 plus a first pass at P2/P3 for the highest-value screens (Mines, Compliance, Inspections, role dashboards); remaining modules are tracked honestly in `docs/C2_HANDOFF.md` as NOT IMPLEMENTED, not glossed over.
