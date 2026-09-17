# MOBILE_SPEC.md

## Scope
Owned primarily by Account 2 (Expo/React Native). Account 1 guarantees the contracts below so mobile development is never blocked on backend availability.

## Shared Contracts
- `packages/types` — all DTOs (mines, compliance, inspections, incidents, contractors, attendance, environmental, production, grievances, AI). Import directly into the Expo app; no duplication.
- `packages/validation` — Zod schemas reused for client-side form validation before hitting the API (better offline UX, same rules as server).

## Auth
Supabase JS client (`@supabase/supabase-js`) configured with Expo SecureStore as the auth storage adapter. Mobile authenticates identically to web — same `profiles`/`user_roles` tables, same RLS.

## Primary Mobile Use Cases → API Routes
| Use case | Route(s) |
|---|---|
| Inspector conducts field inspection | `POST /api/inspections`, `POST /api/inspections/:id/observations` |
| Photo/evidence capture | Signed upload URL flow (see STORAGE.md) |
| Geo-tagging | Client captures device GPS → sent as `latitude`/`longitude` in the same request body as web |
| Contractor views own documents/compliance | `GET /api/contractors/:id/documents`, `GET /api/compliance/records?contractorId=` |
| Worker attendance check-in | `POST /api/attendance` |
| Offline queueing | Out of scope for Account 1; if implemented, Account 2 should queue validated (Zod-checked) payloads locally and replay against the same idempotent-safe routes |

## Constraints for Account 2 (Mobile)
- Do not call Supabase tables directly for mutations that have business logic (e.g., compliance status transitions, corrective action verification) — always go through `/api/*` so audit logging and validation run consistently. Direct Supabase reads are fine for simple, RLS-protected list views.
- Do not assume `SUPABASE_SERVICE_ROLE_KEY` is available on-device — it never is.

## Offline Field Reporting (v2 — no longer out of scope)

**Account 1 provides the sync contract; Account 2 implements the client.**

Backend contract (see DATABASE.md §7b, API.md idempotency section):
- Offline-capable entities: inspections, inspection_observations, incidents, safety_observations, worker_attendance.
- Each accepts an optional `clientOperationId` (uuid, client-generated) + `clientCreatedAt` on `POST`. Retried submissions with the same `clientOperationId` return the existing row (`200`), never a duplicate.
- `syncStatus` (`SYNCED`/`PENDING`/`CONFLICT`) is returned so the client can reflect sync state in its UI.
- Conflict policy: server data wins; a conflicting local edit is returned to the client as `CONFLICT` with the server's current version, for the user to manually re-apply. No automatic merge.

Client responsibilities (Account 2), for a practical SIH prototype — not a distributed-sync system:
1. Create inspection/observation/incident/attendance records while offline; generate a `clientOperationId` (uuid v4) at creation time.
2. Persist locally (Expo `AsyncStorage` or `expo-sqlite` — Account 2's choice) with a `pending` flag, including observation/photo metadata (actual photo bytes queued for upload once online).
3. On connectivity return, POST queued records in order, including `clientOperationId`; mark `synced` on success.
4. Retry failed syncs with backoff; never drop a record silently.
5. Treat a `200` response to a retried `clientOperationId` as success, not an error — this is what makes retries duplicate-safe.

## Known Gaps (documented, not hidden)
Push notifications and biometric login are not part of the Account 1 foundation and are not required for the SIH demo unless Account 2 adds them independently. Offline sync is now in scope per the split above — not a gap.
