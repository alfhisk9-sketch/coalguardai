# API.md

All routes under `apps/web/app/api/*`. Auth via Supabase session cookie (web) / bearer token (mobile). Every route: (1) authenticates, (2) checks permission, (3) validates input with Zod, (4) executes, (5) writes audit log for mutations, (6) returns consistent JSON.

**Response shape:**
```ts
// success
{ data: T, meta?: { page, pageSize, total } }
// error
{ error: { code: string, message: string, details?: unknown } }
```

## Conventions
- Pagination: `?page=1&pageSize=20` (default 20, max 100).
- Filtering: `?mineId=`, `?status=`, `?from=`, `?to=` where applicable.
- Sorting: `?sortBy=field&sortDir=asc|desc`.
- All mutating routes require the matching permission key (see ROLES.md).
- **Idempotency:** for the 5 offline-capable entities (inspections, inspection observations, incidents, safety observations, attendance), `POST` accepts an optional `clientOperationId` (uuid) in the body. If a row with that `client_operation_id` already exists, the route returns the existing row with `200` (not `201`, not an error) — safe to retry indefinitely from a flaky mobile connection. All other entities are server-created only and don't need this field.

## Modules & Routes

| Route | Methods | Permission | Notes |
|---|---|---|---|
| `/api/mines` | GET, POST, PATCH | `mines.view` / `mines.manage` | Scoped to org/subsidiary/region for admins |
| `/api/compliance/requirements` | GET, POST, PATCH | `compliance.view` / `compliance.manage` | |
| `/api/compliance/records` | GET, POST, PATCH | `compliance.view` / `compliance.manage` | includes `record-compliance`, `mark-compliant` actions |
| `/api/compliance/records/:id/evidence` | POST | `documents.upload` | |
| `/api/compliance/summary` | GET | `compliance.view` | powers dashboards |
| `/api/inspections` | GET, POST, PATCH | `inspections.view` / `inspections.create` | |
| `/api/inspections/:id/observations` | GET, POST | `inspections.create` | |
| `/api/inspections/:id/approve` | POST | `inspections.approve` | |
| `/api/corrective-actions` | GET, POST, PATCH | `compliance.manage` / `inspections.approve` (context-dependent) | polymorphic source |
| `/api/incidents` | GET, POST, PATCH | `incidents.view` / `incidents.create` | |
| `/api/contractors` | GET, POST, PATCH | `contractors.view` / `contractors.manage` | |
| `/api/contractors/:id/workers` | GET, POST | `contractors.manage` | |
| `/api/contractors/:id/documents` | GET, POST | `contractors.manage` / `documents.upload` | |
| `/api/attendance` | GET, POST | `contractors.manage` | worker attendance |
| `/api/environmental/points` | GET, POST | `mines.manage` | |
| `/api/environmental/readings` | GET, POST | `mines.manage` | demo-labeled thresholds |
| `/api/production/reports` | GET, POST, PATCH | `reports.generate` | |
| `/api/grievances` | GET, POST, PATCH | `dashboard.view` (submit) / role-gated read | confidential rows filtered server-side too |
| `/api/documents` | GET, POST | `documents.upload` | returns signed URLs, never public paths |
| `/api/notifications` | GET, PATCH (mark read) | self-scoped, no explicit permission needed |
| `/api/reports` | GET | `reports.view` | generic report queries |
| `/api/dashboard/:role` | GET | `dashboard.view` | role-specific aggregate queries |
| `/api/audit` | GET | `audit.view` | read-only |
| `/api/ai/*` | POST | `ai.view` | thin wrapper calling `AIService`; stub responses until Account 3 implements |

## Example Contract — `POST /api/inspections`

Request:
```json
{
  "mineId": "uuid",
  "templateId": "uuid|null",
  "inspectionType": "string",
  "scheduledDate": "2026-09-15",
  "latitude": 21.23,
  "longitude": 81.63
}
```
Response `201`:
```json
{ "data": { "id": "uuid", "status": "SCHEDULED", ... } }
```
Errors: `400` validation, `401` unauthenticated, `403` missing permission or wrong mine scope, `404` mine not found, `500` unexpected (logged server-side, generic message to client).

## Change Management
Any change to a route's request/response shape, or a renamed field, requires: (1) updating this file in the same PR, (2) updating the corresponding Zod schema in `packages/validation`, (3) updating the corresponding type in `packages/types`, (4) a note in `HANDOFF.md` "Known Changes" section if it affects Account 2/3. **Account 2 and Account 3 must not modify API/database contracts directly** — breaking changes are proposed here and in `HANDOFF.md` first, then implemented by Account 1 (or reviewed by Account 1 if urgency requires another account to touch shared packages).

## Contract Testing Strategy
Each MVP endpoint has a test asserting the full chain: valid input → Zod request schema accepts → handler executes → Zod response schema validates the output shape → correct HTTP status. A parallel negative test asserts an unauthorized/wrong-permission/wrong-mine-scope caller gets `401`/`403` and touches no data. Minimum coverage: auth, mine access scoping, compliance, inspections, observations, corrective actions, incidents, contractor isolation, document access, dashboard scope. See `apps/web/tests/` (Phase 9, implemented alongside Phase 5 routes where practical). Tests run with `npm test` against a local/test Supabase instance or a mocked Supabase client for pure business-logic units.
