# HANDOFF.md
**Owner:** Claude Account 1 (Lead Architect / Backend)
**Last updated:** Phase 5/8/9 (partial) — route handlers, contract tests, seed data implemented and verified; see IMPLEMENTATION STATUS below for the authoritative per-area breakdown.

## 1. Completed Work
- Phase 0: Requirements analysis, module map with MVP/Important/Enhancement tiers (`REQUIREMENTS.md`), revised twice per team corrections.
- Phase 1: Full architecture docs, revised per corrections — `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ROLES.md`, `SECURITY.md`, `STORAGE.md`, `GIS_SPEC.md`, `AI_SPEC.md`, `MOBILE_SPEC.md`, this file.
- Phase 2 (partial): monorepo scaffolded (`package.json` workspaces), shared packages written (`@sih/types`, `@sih/validation`, `@sih/config`), `apps/web` package/tsconfig set up. `npm install` run successfully.
- Phase 3: 11 database migrations written and applied cleanly to a real local Postgres 16 instance (twice, fresh DB both times). RLS policies written and verified with a real smoke test run as a non-superuser role.
- Phase 5 (core): Route handlers for all 11 core API modules implemented (auth→Zod→authz→service→DB→audit→response pattern), backed by a real service layer + in-memory test double + (unverified-live) Supabase implementation. 4 additional modules (environmental/production/attendance/grievances) implemented at a lighter tier — see IMPLEMENTATION STATUS below.
- Phase 8: Seed data (`supabase/seed/seed.sql`) written and applied to real Postgres — 4 fictional mines, all modules populated, 0 referential-integrity errors.
- Phase 9 (partial): 43 contract tests written and passing (`npx vitest run`). TypeScript typecheck clean (`tsc --noEmit`, 38 files).
- **See "IMPLEMENTATION STATUS" section below for the complete, accurate, per-area breakdown — that section is authoritative over any summary here.**

## 2. Repository Structure (implemented)
```
apps/web/          — Next.js app: app/api/* route handlers, lib/ (services, db, authz, errors)
  app/api/{mines,compliance,inspections,corrective-actions,incidents,contractors,documents,notifications,audit,dashboard,attendance,environmental,production,grievances}/
  lib/{authz,errors,auth-context,supabase-client}.ts
  lib/db/{types,memory,supabase}.ts
  lib/services/{mines,compliance,inspections,corrective-actions,incidents,contractors,documents,notifications,audit,dashboard}.ts
  tests/*.test.ts  — 43 passing contract tests
apps/mobile/        — not started (Account 2)
packages/types/      — shared DTOs + AIService/OCRService interfaces
packages/validation/ — shared Zod schemas
packages/config/     — role/permission keys, ROLE_PERMISSION_MATRIX
supabase/migrations/ — 0001–0011, applied and tested
supabase/seed/        — seed.sql, applied and tested
docs/*               — this file + 10 siblings, all current
scripts/              — local_test_setup.sql, rls_smoke_test.sql (local-only, not for production)
```

## 3. Database Status
Schema fully implemented: 11 migrations, ~45 tables, applied cleanly to real Postgres. RLS enabled and policy-tested on all mine-scoped and contractor-scoped tables. Seed data applied and verified (4 mines, 19 populated tables).

## 4. Authentication Status
Schema + RLS helper functions (`fn_user_has_permission`, `fn_user_has_mine_access`) implemented and tested. `lib/auth-context.ts` (session → AuthContext) and `lib/db/supabase.ts` are written but **NOT VERIFIED against a live Supabase project** — see IMPLEMENTATION STATUS.

## 5. API Status
11 core modules fully implemented and contract-tested. 4 additional modules implemented at a lighter tier (see IMPLEMENTATION STATUS). No live HTTP server has been run (would require a live Supabase project for the auth layer) — route handlers are verified via typecheck + the service layer underneath them is verified via 43 passing contract tests.

## 6. Known Limitations (explicit, per Rule 1/2)
See the "IMPLEMENTATION STATUS" section below for the complete, current, authoritative list.

## 7. Environment Variables (implemented)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```
`.env.example` created at repo root, placeholders only — grepped to confirm no real secrets present.

## 8. Commands to Run
```
npm install                       # from repo root
cd apps/web && npx vitest run     # 43 contract tests, all passing
cd apps/web && npx tsc --noEmit   # typecheck, clean
```
Database commands require local Postgres or `supabase start` — see CONTRACT FREEZE below for the exact migration/seed order.

## 9. Frontend Integration Instructions (Account 2)
`packages/types` and `packages/validation` are stable — import, do not redefine. The 11 core API routes are implemented and contract-tested at the service layer. Per the review correction, Account 2 does not need to wait for every API — start on app shell/navigation/layouts/components now using typed mock adapters matching `packages/types`, swap in real `fetch` calls per route as needed.

## 10. Mobile Integration Instructions (Account 2)
See `MOBILE_SPEC.md` in full. The sync contract (`clientOperationId`, idempotent retry) is implemented and tested for inspections, observations, and incidents; attendance has the same DB-level contract but sits on the lighter implementation tier (see IMPLEMENTATION STATUS).

## 11. AI Integration Instructions (Account 3)
See `AI_SPEC.md` in full, especially §7 (raised AI demo bar). `AIService`/`OCRService` interfaces and DTOs are frozen in `packages/types`; DB tables exist and are migration-tested. No stub implementation class was written — Account 3 implements the interfaces directly.

## 12. Known Bugs
None open. Two were found and fixed during implementation — see "Known Bugs" under IMPLEMENTATION STATUS below.

## 13. Next Recommended Tasks (in order)
1. Provision a real Supabase project; verify `lib/auth-context.ts`, `lib/db/supabase.ts`, and a live `next build`/request against it (currently NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION).
2. Bring the 4 additional modules (environmental, production, attendance, grievances) onto the shared `Db`/service pattern with dedicated contract tests, matching the 11 core modules.
3. Account 2: begin web/mobile UI per `ARCHITECTURE.md` §4b (parallel-work guidance).
4. Account 3: implement `AIService`/`OCRService` against Gemini per `AI_SPEC.md`.

## 14. Change Log
- v1: Phase 0 initial requirements.
- v2: Phase 0 revised (environmental, production, attendance, grievance modules added; OCR made provider-independent). Phase 1 architecture docs completed.
- v3: Corrections applied per team review — `profiles.mine_id` removed (user_roles sole authority), contractor isolation formalized, offline mobile sync contract defined, C1/C2/C3 ownership tightened, AI demo bar raised. Route handlers, contract tests, seed data implemented and run for real (see IMPLEMENTATION STATUS and CONTRACT FREEZE below).
- v4: Independent re-verification this session — fresh Postgres DB, all 11 migrations + seed reapplied cleanly (0 errors), row counts spot-checked across 11 tables. ESLint added and run clean (`next lint`: 0 warnings/errors). `next build` re-run and confirmed exit 0 / 20 routes compiled — corrected its status from "not verified" to "build succeeds" (live request against real Supabase remains the one genuinely unverified piece). Typecheck and 43 contract tests re-run and still pass.
- v5: Prior delivery included the repo as a `.tar.gz` alongside the doc files, but this wasn't recognized as a source repository on review. Found and removed a stray artifact (`apps/web/app/api/{mines,compliance...}` — a literal directory created by an earlier failed shell brace-expansion, harmless but confusing). Re-ran `npm install` → `tsc --noEmit` → `next lint` → `vitest run` → `next build` from a clean state: **all five exit 0**, 43/43 tests passing. Repackaged as `.zip` (76 source files, 123 with configs/lockfile) for clearer delivery.

---

# IMPLEMENTATION STATUS (accurate as of this update)

Legend: **IMPLEMENTED** = written and verified by an actual command run in this environment. **PARTIALLY IMPLEMENTED** = working code exists but with a named gap. **NOT IMPLEMENTED** = not started. **KNOWN LIMITATION** = a permanent, documented scope boundary, not a gap to close later.

| Area | Status | Evidence |
|---|---|---|
| Requirements & architecture docs (11 files) | **IMPLEMENTED** | All 11 docs in `docs/`, reviewed and revised twice |
| Database migrations (0001–0011) | **IMPLEMENTED** | Applied cleanly to a real local Postgres 16 instance, zero errors, twice (fresh DB both times) |
| RLS policies | **IMPLEMENTED** | 5/5 smoke-test assertions passed as a genuine non-superuser role: mine isolation, contractor A/B isolation (both directions), idempotent retry, unauthenticated denial — re-verified again after seeding |
| Seed data (4 mines + all modules) | **IMPLEMENTED** | `supabase/seed/seed.sql` applied to a real local Postgres instance; row counts verified (4 mines, 19 tables populated, 0 FK errors) |
| Shared packages (`@sih/types`, `@sih/validation`, `@sih/config`) | **IMPLEMENTED** | Written, imported by both route handlers and tests, typecheck passes |
| Route handlers — 11 core modules (mines, compliance, inspections, observations, corrective actions, incidents, contractors, documents, notifications, audit, dashboard) | **IMPLEMENTED** | Full auth→Zod→authz→service→DB→audit→response pattern; `tsc --noEmit` passes with these files included |
| Route handlers — 4 additional modules (environmental, production, attendance, grievances) | **PARTIALLY IMPLEMENTED** | Validated, authorized, working inserts exist; they bypass the shared `Db`/service abstraction (direct Supabase calls), so no in-memory fake and no dedicated contract test back them |
| Contract tests | **IMPLEMENTED** | 43/43 passing (`npx vitest run`), covering all 10 required areas from the review: auth primitives, mine scoping, compliance, inspections+observations (incl. idempotent offline retry), corrective actions, incidents, contractor isolation (both directions), document access, dashboard scope — plus negative/forbidden cases throughout |
| `npm install` | **IMPLEMENTED** | Ran clean, 84 packages, 0 install errors (7 npm-audit advisories noted, not blocking for a prototype) |
| TypeScript typecheck (`tsc --noEmit`) | **IMPLEMENTED** | Clean across all 38 files in `apps/web` (route handlers, lib, tests) — 2 real bugs found and fixed (unsafe array-index typing in `MemoryDb`, implicit-`any` cookie callbacks) |
| Lint | **IMPLEMENTED** | `.eslintrc.json` (extends `next/core-web-vitals`) added, `eslint`/`eslint-config-next` installed. `npx next lint` → 0 warnings, 0 errors |
| Build (`next build`) | **IMPLEMENTED (build succeeds); live runtime NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION** | `npx next build` exits 0, all 20 API routes compile and register as dynamic (correct — they read auth cookies). This does NOT require real Supabase credentials because `createServerClient` only constructs a client at build time, it doesn't connect. Actually calling a route and getting a real response still requires a live Supabase project — that part remains unverified. |
| `SupabaseDb` (real DB-backed implementation) | **NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION** | Written directly off `DATABASE.md`'s column names; never executed against a live Supabase project because none exists here. The migrations it targets ARE verified (see above) |
| `getAuthContext` (Supabase session → AuthContext) | **NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION** | Same reason — needs a live Supabase Auth session/JWT to exercise |
| AI (`AIService`) / OCR (`OCRService`) | **IMPLEMENTED** (interfaces + types only, by design) | Interfaces, DTOs, DB tables (`risk_scores`, `anomaly_events`, `ai_analysis_results`, `ai_recommendations`) all exist. No stub *implementation class* was written this session — only the interface/types/tables, which is what Account 1's scope requires (AI_SPEC.md §6) |
| Mobile offline sync contract | **IMPLEMENTED** (backend contract only, by design) | `client_operation_id`/`client_created_at`/`sync_status` columns, partial unique indexes, idempotent route behavior (200 vs 201), all tested. Client-side implementation is explicitly Account 2's scope |
| `.env.example` | **IMPLEMENTED** | Created, contains placeholders only — grepped to confirm no real secrets |
| Six roles functioning end-to-end | **PARTIALLY IMPLEMENTED** | All 6 roles exist in the schema, seed data, and are exercised in contract tests against the service layer; RLS-level testing covered MINE_MANAGER, CONTRACTOR (x2), and SUPER_ADMIN directly — INSPECTOR/CORPORATE_ADMIN/REGULATOR are covered in service-layer tests but not separately re-run through the raw RLS smoke test |
| Blockchain, biometric attendance, push notifications, offline-first CRDT sync, PostGIS | **KNOWN LIMITATION** | Explicitly out of scope per REQUIREMENTS.md/ARCHITECTURE.md/MOBILE_SPEC.md — not gaps, deliberate boundaries |

## Known Bugs
None currently open. Two were found and fixed during this work (documented for Account 2/3's awareness, since they reflect real gotchas in this stack):
1. Postgres superuser/table-owner silently bypasses RLS — any local RLS testing must run as a non-owner role (`app_authenticated` in `scripts/`), never as `postgres`. This does not affect production Supabase (the `authenticated` role there is never the table owner), but it's a real trap for anyone testing migrations locally.
2. Partial unique indexes (used for `client_operation_id`) require the `WHERE` clause to be repeated in `ON CONFLICT` for Postgres to match the index — plain `ON CONFLICT (col)` fails to infer a partial index.

---

# ACCOUNT 1 CONTRACT FREEZE

This section is the primary contract for Account 2 and Account 3. Treat everything below as stable; changes require updating this section, `API.md`, and/or `DATABASE.md` in the same change.

**Schema version:** migrations `0001`–`0011` (11 files, applied and RLS-tested against Postgres 16). No migration beyond `0011` exists.
**API version:** v1 (unversioned in the URL — first release, no prior version to distinguish from).
**Seed data version:** `supabase/seed/seed.sql`, 4 fictional mines, applied and row-count-verified.

### Files Account 2 and Account 3 may consume directly
- `packages/types/src/index.ts` — all DTOs, `AIService`, `OCRService` interfaces. **Import, do not redefine.**
- `packages/validation/src/index.ts` — all Zod schemas for MVP create/update payloads.
- `packages/config/src/index.ts` — role keys, permission keys, `ROLE_PERMISSION_MATRIX`, offline-syncable entity list.
- `docs/API.md`, `docs/DATABASE.md`, `docs/ROLES.md`, `docs/SECURITY.md`, `docs/MOBILE_SPEC.md`, `docs/AI_SPEC.md`, `docs/GIS_SPEC.md`, `docs/STORAGE.md` — all current and reflect the frozen contract.
- `supabase/migrations/*.sql` — the schema itself. Do not hand-edit; propose changes as new migration files.
- `.env.example` — the full list of required environment variables.

### Authentication
Supabase Auth (JWT session). Web via `@supabase/ssr` cookie-based client; mobile via `@supabase/supabase-js` + Expo SecureStore. See `lib/auth-context.ts` for the exact session→`AuthContext` resolution logic (NOT VERIFIED live, but the query shape matches `0003_rbac.sql` exactly).

### Authorization / RLS model
Two-layer: RLS (database, real boundary) + API middleware (`lib/authz.ts`, fast-fail/clean-error layer). Both read `user_roles` exclusively for mine scope.

### Mine-scoping model
`user_roles(user_id, role_id, mine_id)` is the **sole** source of mine access. `mine_id = null` on a `user_roles` row means org-wide (SUPER_ADMIN/CORPORATE_ADMIN only, by convention — not DB-enforced beyond the RLS helper function's role-key check). `profiles` has no mine-scope column, permanently.

### Contractor-scoping model
`profiles.contractor_id → contractors.id`, 1:1. RLS and `lib/services/contractors.ts`'s `listWorkersForContractor` both enforce this independent of mine access. Verified in `tests/contractor-isolation.test.ts` (both directions) and the RLS smoke test against real seeded demo accounts.

### Mobile offline synchronization contract
Entities: `inspections`, `inspection_observations`, `incidents`, `safety_observations`, `worker_attendance`. Each accepts `clientOperationId` (uuid) + `clientCreatedAt` on create. Retry with the same `clientOperationId` → `200` + existing row (never a duplicate; enforced by a partial unique index + service-layer lookup, both tested). `syncStatus` (`SYNCED`/`PENDING`/`CONFLICT`) reflects state; conflict resolution is server-wins with no auto-merge.

### Storage contract
Private Supabase Storage buckets, signed URLs only, server-side MIME/size revalidation (`lib/services/documents.ts`, tested: oversized and disallowed-MIME uploads are rejected server-side even if a client bypassed its own check).

### AIService interface (frozen)
`analyzeComplianceRisk, analyzeInspection, detectAnomaly, summarizeMine, analyzeDocument, answerAssistantQuery` — see `packages/types/src/index.ts`. No stub class implemented; Account 3 implements `AIService` directly. Non-blocking guarantee: no core route imports a concrete AI implementation as a required dependency.

### OCRService interface (frozen)
`extractText, extractStructuredData, classifyDocument` — provider-independent by construction (no Gemini-specific types leak into the interface).

### Known limitations (repeated from above for a single reference point)
`next build`'s live runtime behavior (an actual HTTP request against a real Supabase project) and the two Supabase-backed runtime files (`lib/auth-context.ts`, `lib/db/supabase.ts`) are not verified live — no Supabase project is provisioned in this environment; 4 additional modules (environmental/production/attendance/grievances) on a lighter, untested implementation tier; no blockchain/biometrics/push/PostGIS/CRDT sync (all permanent, documented scope boundaries).

### Commands
```
npm install                              # from repo root — installs all workspaces
cd apps/web && npx vitest run            # 43 contract tests
cd apps/web && npx tsc --noEmit          # typecheck, clean
cd apps/web && npx next lint             # 0 warnings/errors
cd apps/web && npx next build            # exits 0, 20 routes compiled
# Database (requires local Postgres or `supabase start`):
# apply supabase/migrations/0001 through 0011, in order, then:
psql -f supabase/seed/seed.sql           # after migrations — 4 fictional mines, 0 FK errors
```

### Environment variables (see `.env.example`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` — all placeholders only in the committed file.
