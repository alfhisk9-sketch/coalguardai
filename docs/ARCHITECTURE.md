# ARCHITECTURE.md

## 1. High-Level Diagram (textual)

```
apps/web (Next.js App Router, TS)  ──┐
apps/mobile (Expo, Account 2)      ──┼──> Supabase (Postgres + Auth + Storage)
                                     │         ▲
                                     │         │ RLS = source of truth
packages/types  ──shared DTOs──────>│         │
packages/validation ──shared Zod──> │         │
                                     │
Gemini API  <── AIService interface ┘ (Account 3)
```

- **Single backend surface:** Next.js Route Handlers under `apps/web/app/api/*`. No separate Node/Express service — reduces moving parts for a beginner team.
- **Supabase is both the database and the primary authorization boundary** (RLS). API routes add a second layer of role/permission checks (defense in depth) and handle validation, business logic, and audit logging.
- **Mobile app talks directly to Supabase (auth/storage) and to the same `/api/*` routes** for business logic that needs server-side rules (e.g., compliance status transitions), so logic isn't duplicated between web and mobile.

## 2. Monorepo Layout

```
apps/
  web/                 Next.js app (Account 1 backend + Account 2 frontend)
  mobile/               Expo app (Account 2)
packages/
  types/                Shared TS types/DTOs (source of truth for API shapes)
  validation/           Shared Zod schemas (imported by web API routes + mobile forms)
  config/               Shared constants (permission keys, enums mirrored from DB)
  ui/                   Shared shadcn/ui components (Account 2 primary owner)
supabase/
  migrations/           SQL migrations, timestamped
  seed/                 Seed scripts (demo data)
docs/                   All specs (this file + siblings)
```

## 3. Core Design Decisions

| Decision | Rationale |
|---|---|
| Next.js Route Handlers instead of separate backend | Fewer deployables, fewer auth handoffs, beginner-friendly |
| Supabase RLS as primary authz | Prevents any client (web/mobile/future) from bypassing rules |
| Zod schemas shared via `packages/validation` | One definition of "valid input," used both server-side and in mobile forms |
| AI/OCR behind interfaces (`AIService`, `OCRService`) | Swappable provider, and — critically — core workflows never depend on AI/OCR succeeding |
| Plain lat/lng, not PostGIS | Lower setup risk; upgrade path documented, not built now |
| In-app notifications only for MVP | `notification_rules` table designed so email/SMS adapters plug in later without touching trigger logic |
| Simple state-machine workflow (`workflow_events`), not a rules engine | Matches actual need (inspection→review→CAPA→verify→close) without over-engineering |
| Modules tiered MVP/Important/Enhancement | Keeps a 6-person beginner team focused on a demoable core first |

## 4. Ownership Boundaries (precise)

**Account 1 owns:** database schema & migrations, RLS policies, API route handlers, shared types (`packages/types`), shared validation (`packages/validation`), backend business rules, dashboard query contracts, authentication, storage contract, mobile sync/idempotency contract.

**Account 2 owns:** web UI, responsive design, dashboard UI, forms, charts, GIS visualization (Leaflet), the Expo mobile app, mobile offline local storage, mobile sync client logic (consuming Account 1's sync contract).

**Account 3 owns:** Gemini integration, AI prompts, risk scoring logic, anomaly detection logic, AI assistant, OCR implementation, AI result validation, AI-specific testing.

**Rule:** Account 2 and Account 3 never silently modify Account 1's schema, RLS, API contracts, or shared packages. A needed breaking change is proposed in `API.md`/`DATABASE.md` and logged in `HANDOFF.md` before any account implements it.

## 4b. Parallel Work — Account 2 Does Not Have to Wait for All of Phase 5

Once Account 1 has shipped: stable schema, documented API contracts, shared types, and a working auth contract (end of Phase 4), Account 2 can start immediately on: app shell, navigation, role-based layouts, dashboard skeletons, reusable components, loading/empty states, forms, mobile navigation, and offline UI architecture — using **typed mock adapters** that match `packages/types` exactly. Each mock adapter is swapped for a real `fetch` call to the corresponding route as Account 1 ships it in Phase 5, with no shape changes required on the Account 2 side if the mock was built against the real types.

## 4c. Offline Mobile Sync — Responsibility Split

| Responsibility | Owner |
|---|---|
| Sync contract (idempotency key, timestamps, conflict semantics) | Account 1 (see DATABASE.md §7b, API.md idempotency section) |
| Local on-device storage, queueing, retry, connectivity detection | Account 2 |
| Server-side duplicate prevention via `client_operation_id` | Account 1 |
| Conflict UI (surfacing a `CONFLICT` row back to the user) | Account 2 |

Deliberately practical: last-write-wins + duplicate-safe retries, not a distributed CRDT/merge system.

## 5. Cross-Cutting Concerns

- **Audit:** every mutating API route calls a shared `logAudit()` helper (see SECURITY.md).
- **Validation:** every route validates with a Zod schema from `packages/validation` before touching the DB.
- **Error handling:** centralized error formatter (`lib/api/errors.ts`) — consistent `{ error: { code, message } }` shape, no stack traces or DB errors leaked to clients.
- **Environment variables:** documented in `.env.example`; never read ad hoc — always through a typed `env.ts` accessor that fails fast on missing required vars.

## 6. What Account 1 Will NOT Build

- Visual dashboard UI (data queries only — Account 2 renders).
- Gemini prompt engineering / actual AI inference (Account 3).
- Actual OCR text extraction (Account 3).
- Mobile app UI (Account 2), though API contracts are mobile-ready from day one.
- Blockchain audit (explicitly out of scope; noted as future enhancement).
