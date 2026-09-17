# C2_HANDOFF.md
**Owner:** Claude Account 2 (Frontend + Mobile)
**Status:** C2-P0 → C2-P6 complete. C2-P7 (live integration) **BLOCKED — no Supabase project provisioned.**

Legend (project rule 45): **IMPLEMENTED** = written and proven by a command run in this environment. **PARTIALLY IMPLEMENTED** = working, with a named gap. **MOCKED** = typed demo adapter, visibly badged in the UI. **NOT IMPLEMENTED** = not built. **NOT VERIFIED** = written, never executed against a live system.

---

## TYPECHECK

```
cd apps/web    && npx tsc --noEmit     → exit 0, clean
cd apps/mobile && npx tsc --noEmit     → exit 0, clean
```
**Result: PASS (both).**

## LINT

```
cd apps/web && npx next lint           → No ESLint warnings or errors
```
**Result: PASS.** Mobile has no lint config; not claimed as passing.

## TESTS

```
cd apps/web    && npx vitest run       → 9 files, 74 tests, 74 passed
cd apps/mobile && npx vitest run       → 1 file, 15 tests, 15 passed
```
**Actual current count: 89 tests passing.**

| Suite | Tests | Owner |
|---|---|---|
| `authz`, `mines`, `compliance`, `inspections`, `documents-dashboard`, `contractor-isolation`, `corrective-actions-incidents` | 43 | C1 — **untouched, still passing** |
| `c2-read-endpoints` (new) | 10 | C2 — contract tests for the new GET routes |
| `frontend` (new) | 21 | C2 — nav filtering, form validation, API errors, badge mapping, portfolio aggregation |
| `apps/mobile/tests/queue` (new) | 15 | C2 — offline queue transitions, dependency ordering, photo isolation, idempotency |

## BUILD

```
cd apps/web && npx next build          → exit 0
```
**Result: PASS.** 24 pages + 24 API routes compiled.

## MOBILE VALIDATION

Typecheck and unit tests pass (above). **The Expo app has never been launched** — no `expo start`, no simulator, no device, no Metro bundle. Runtime behaviour is **NOT VERIFIED**.

## LIVE SUPABASE

**NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION.**

No Supabase project exists in this environment. Therefore:
- No login has ever succeeded, on web or mobile.
- No screen has ever rendered a real database row.
- No file has ever been uploaded to storage.
- No sync has ever reached a real server.
- RLS policies have never been exercised by a real request.

Everything below is proven to compile, typecheck, lint and pass unit tests. **Nothing below is proven to work end-to-end.** This is the single largest caveat in this document.

---

## WEB — every page and status

| Route | Status | Data source | Notes |
|---|---|---|---|
| `/login` | PARTIALLY IMPLEMENTED / NOT VERIFIED | Supabase auth | Real `signInWithPassword`; never executed live. Demo-session entry when `NEXT_PUBLIC_DEMO_MODE=true` |
| `/dashboard` | IMPLEMENTED | Real API | Routes to one of five role dashboards |
| `/mines` | IMPLEMENTED | Real API | Search, type + risk filters |
| `/mines/[id]` | IMPLEMENTED | Real API | Tabs: Overview / Compliance / Inspections / Incidents |
| `/map` | IMPLEMENTED | Real API | Leaflet + OSM, plain lat/lng, no PostGIS. Mine + incident markers, filters |
| `/compliance` | IMPLEMENTED | Real API | Filters, score KPIs, working PATCH to record compliance |
| `/corrective-actions` | IMPLEMENTED | **Real API (was mocked)** | Now uses the new mine-scoped GET route |
| `/documents` | PARTIALLY IMPLEMENTED | Real API (metadata) | List + metadata registration real. **Binary upload / signed download NOT IMPLEMENTED** — stated on-screen |
| `/inspections` | IMPLEMENTED | Real API | Status filters, workflow legend |
| `/inspections/new` | IMPLEMENTED | Real API | Shared Zod schema, real GPS, `clientOperationId` idempotency |
| `/inspections/[id]` | IMPLEMENTED | **Real API (was write-only)** | Now lists saved observations with severity, timestamp, GPS, evidence + sync status |
| `/observations` | IMPLEMENTED | Real API | Composed from inspections → per-inspection observations |
| `/incidents` | IMPLEMENTED | Real API | Severity filters, KPIs |
| `/contractors` | IMPLEMENTED | **Real API (new route)** | Search + status filter |
| `/contractors/[id]` | PARTIALLY IMPLEMENTED | Real API | Workers + documents real. Compliance score / expiry show "—" — **no backend field exists**; not fabricated |
| `/workers` | **MOCKED** | `lib/api/mock.ts` | Demo Data badge. No cross-contractor worker endpoint |
| `/attendance` | **MOCKED** | `lib/api/mock.ts` | Demo Data badge. GPS + sync indicators. No biometrics |
| `/environmental` | **MOCKED** | `lib/api/mock.ts` | Demo Data badge. NORMAL/WARNING/EXCEEDED. Explicit disclaimer that thresholds are **not** official regulatory limits |
| `/production` | **MOCKED** | `lib/api/mock.ts` | Demo Data badge. Target-vs-actual + variance trend charts |
| `/grievances` | PARTIALLY IMPLEMENTED | Mixed | **Submission is REAL** (`POST /api/grievances`). List is MOCKED + badged. Confidentiality stated |
| `/reports` | PARTIALLY IMPLEMENTED | Real API | 5 of 7 reports run against real data with date filters. Environmental + production marked "Blocked". **PDF/Excel export NOT IMPLEMENTED — control disabled, not faked** |
| `/notifications` | IMPLEMENTED | Real API | Unread/read filter, mark-read |
| `/audit` | IMPLEMENTED | Real API | Action/entity filter |
| `/admin` | PARTIALLY IMPLEMENTED | Real API | Overview, read-only role×permission matrix, mine config. **User/role CRUD NOT IMPLEMENTED — no backend endpoints exist**; stated on-screen rather than faked |

**All 18 navigation entries resolve to real pages. No 404s, no "Coming Soon" placeholders.**

Shell, states, a11y: responsive sidebar (≥lg) / drawer (<lg), role-filtered nav, loading/error/empty/retry on every data page via `useAsync` + `data-states.tsx`, semantic HTML, `aria-current`, labelled controls, visible focus rings, ≥44px touch targets.

## MOBILE — every screen and status

| Screen | Status | Notes |
|---|---|---|
| Login | IMPLEMENTED / NOT VERIFIED | Supabase auth, session in SecureStore (never AsyncStorage) |
| Home | IMPLEMENTED / NOT VERIFIED | Sync counts, online/offline pill, actions |
| Inspection | IMPLEMENTED / NOT VERIFIED | Start → GPS → observations → severity → photos, all offline-capable |
| Incident | IMPLEMENTED / NOT VERIFIED | Type, severity, description, GPS, photos, offline submit |
| Attendance | IMPLEMENTED / NOT VERIFIED | Worker check-in/out, status, GPS, offline queue. No biometrics |
| Offline queue | IMPLEMENTED (logic tested) / NOT VERIFIED (runtime) | Per-item retry, sync-all, clear-synced, error + attempt display |
| Sync banner | IMPLEMENTED / NOT VERIFIED | Persistent connectivity + queue state |

**Offline queue design** (`src/lib/queue.ts` — pure, no React/IO, hence unit-testable):
- States: `PENDING → SYNCING → SYNCED` / `PENDING → SYNCING → FAILED`. FAILED is re-eligible; never stuck.
- Durable in AsyncStorage; restored before any capture is possible.
- `clientOperationId` + `clientCreatedAt` generated at capture, **preserved across retries** so the C1 idempotency contract deduplicates server-side.
- **Parent/child ordering:** an observation captured offline references its inspection by *queue* id. `readyToSync()` withholds it until the parent reaches SYNCED, then `resolveDependency()` rewrites both `inspectionId` and the endpoint to the real server id.
- **Photo isolation:** a failed photo upload never regresses its parent record. The record stays SYNCED; the photo retries independently. This is the "don't lose an inspection over one photo" requirement, covered by tests.
- Server-wins conflict handling. **No CRDTs, no distributed sync.**

GPS (`src/lib/location.ts`) and camera (`components/PhotoCapture.tsx`) use real Expo APIs. **Coordinates are never fabricated** — permission denial or GPS failure saves the record without coordinates and says so.

## API — every endpoint consumed

Real, via `lib/api/*` (13 typed modules, all using `@sih/types` / `@sih/validation` — no redefined DTOs):

`GET /api/me` · `GET,POST /api/mines` · `GET /api/dashboard/:mineId` · `GET /api/compliance/records` · `PATCH /api/compliance/records/:id` · `GET,POST /api/inspections` · `GET,POST /api/inspections/:id/observations` · `POST /api/inspections/:id/approve` · `GET,POST /api/incidents` · `GET,POST /api/corrective-actions` · `POST /api/corrective-actions/:id/verify` · `GET,POST /api/contractors` · `GET /api/contractors/:id/workers` · `GET,POST /api/documents` · `GET /api/notifications` · `PATCH /api/notifications/:id` · `GET /api/audit` · `POST /api/grievances`

Mobile uses the same routes with `Authorization: Bearer` instead of a session cookie (per API.md). **No mobile-specific backend surface exists.**

## BACKEND CHANGES — every change made by Account 2

No migration, RLS policy, shared type, or Zod schema was modified. Seven additions, each commented at the change site.

| # | Change | Files | Justification |
|---|---|---|---|
| 1 | `GET /api/me` | `app/api/me/route.ts` (new) | Role-based nav needs the resolved `AuthContext` client-side. Thin wrapper over existing `getAuthContext()` |
| 2 | `listInspections()` + `GET /api/inspections` | `lib/services/inspections.ts`, route | Wraps existing `Db.listInspectionsByMine` with the existing `assertMineAccess` pattern |
| 3 | `listIncidents()` + `GET /api/incidents` | `lib/services/incidents.ts`, route | Wraps existing `Db.listIncidentsByMine`, same pattern |
| 4 | `listObservationsByInspection()` on `Db` (+ memory + Supabase impls), `listObservations()` service, `GET /api/inspections/:id/observations` | `lib/db/types.ts`, `memory.ts`, `supabase.ts`, `lib/services/inspections.ts`, route | **Priority 2.** Observations were write-only — an inspector could record and never review. Table already modelled; authz mirrors `addObservation` |
| 5 | `listContractorsByMine()` on `Db` (+ impls), `listContractors()` service, `GET /api/contractors` | same set | Contractor list page. Preserves contractor isolation: a CONTRACTOR-role caller sees only their own record |
| 6 | `listCorrectiveActionsBySource()` on `Db` (+ impls), `listCorrectiveActionsForMine()` service, `GET /api/corrective-actions` | same set | Removed a mock. `corrective_actions` has **no `mine_id`** (polymorphic source), so rather than add a column — a migration plus a second source of truth for mine scope — the service resolves the mine's own inspections/incidents/compliance records and queries by those source ids |
| 7 | `NEXT_PUBLIC_DEMO_MODE` documented | `.env.example` | Optional demo session flag |

**Account 1 should update `API.md`** to document the five new GET routes. I did not edit `API.md` — contract documentation is Account 1's to own.

## MOCKS — every mock still present, and why

All in `apps/web/lib/api/mock.ts`, all badged "Demo data" in the UI.

| Module | Why it cannot use a real route |
|---|---|
| Workers (`/workers`) | Workers are readable **per contractor** (`/api/contractors/:id/workers`). No cross-contractor listing exists |
| Attendance (`/attendance`) | `/api/attendance` is POST-only |
| Environmental (`/environmental`) | `/api/environmental/readings` is POST-only |
| Production (`/production`) | `/api/production/reports` is POST-only |
| Grievances list (`/grievances`) | `/api/grievances` is POST-only. **Submission is real** |

**Why these four were not fixed the way observations/contractors/corrective-actions were:** those three had existing `Db`/service abstractions to wrap. These four **bypass the `Db` layer entirely** and issue direct Supabase calls from the route handler (docs/HANDOFF.md calls them the "lighter tier"). Adding reads means extending the `Db` interface for tables it has never modelled, plus the in-memory double, the Supabase impl, and contract tests — a structural decision that belongs to Account 1, not a minimal integration change.

## REMAINING LIMITATIONS — no hidden work

1. **Nothing verified against live Supabase.** The largest risk.
2. **Expo app never launched.** Typecheck + unit tests only.
3. Four modules mocked (above).
4. **Binary file upload and signed download NOT IMPLEMENTED** (web and mobile). Metadata registration only.
5. **PDF/Excel export NOT IMPLEMENTED.** Export control deliberately disabled.
6. **User/role CRUD NOT IMPLEMENTED.** No backend endpoints; role assignment is a database operation.
7. **`MineDashboard.criticalObservations` is hardcoded to `0`** in `lib/services/dashboard.ts` (C1 code). The UI surfaces it faithfully, so it always reads zero.
8. **Corporate/Regulator dashboards fan out N+1 requests** (`/api/mines`, then `/api/dashboard/:id` per mine). Correct, but won't scale past demo size — no aggregate endpoint exists.
9. **No component/E2E rendering tests.** Frontend tests cover logic (nav filtering, validation, error mapping, aggregation), not DOM rendering. No Playwright or React Testing Library.
10. **Responsiveness verified by construction, not by device testing.** Layouts use responsive breakpoints, tables scroll inside `overflow-auto` containers, charts use `ResponsiveContainer`. No real browser or device was opened.
11. Mobile requires manual mine/worker UUID entry — no picker, because no scoped listing endpoint is reachable pre-sync.

## COMMANDS

```bash
npm install

# web
cd apps/web && npx tsc --noEmit && npx next lint && npx vitest run && npx next build
cd apps/web && npm run dev

# mobile
cd apps/mobile && npx tsc --noEmit && npx vitest run
cd apps/mobile && npx expo start        # NEVER RUN in this environment
```

## ENVIRONMENT VARIABLES

```bash
# web — apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only, never exposed to the client
NEXT_PUBLIC_DEMO_MODE=false         # optional demo session

# mobile — apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

**No secrets are committed.** The service-role key is never referenced in client code or in the mobile app — it would be extractable from any installed binary.

## C3 INTEGRATION POINTS

See `docs/C3_HANDOFF.md` for the full specification.

## DEMO FLOW

Corporate: `/login` → `/dashboard` → `/mines/[id]` → `/compliance` → `/inspections` → `/inspections/[id]` (observations) → `/corrective-actions` → `/incidents` → `/map` → AI panel → `/reports`.

Inspector (mobile): login → home → start inspection → capture GPS → add observation → take photo → go offline → capture more → return online → queue syncs → retry any failure.
