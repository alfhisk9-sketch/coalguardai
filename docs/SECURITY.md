# SECURITY.md

## 1. Authentication
Supabase Auth (email/password for demo; magic link optional). JWT session used by both web (cookie via `@supabase/ssr`) and mobile (stored securely via Expo SecureStore).

## 2. Authorization (defense in depth)
1. **RLS policies** on every table containing mine-scoped or role-sensitive data — enforced at the database, cannot be bypassed by a compromised or buggy client.
2. **API-layer permission checks** (`hasPermission(user, permissionKey, mineId?)`) before any handler logic runs.
3. **Row ownership checks** for self-scoped resources (e.g., a contractor can only fetch their own `contractor_documents`).

Frontend route guards (Account 2) are UX only — never treated as a security boundary.

## 3. Secrets Management
- All secrets in environment variables, never in source.
- `SUPABASE_SERVICE_ROLE_KEY` used only in trusted server-side contexts (never shipped to client bundles, never used in `apps/mobile`).
- `GEMINI_API_KEY` used only inside the `AIService` server implementation.
- `.env.example` ships with placeholder values only; real `.env.local` is gitignored.

## 4. Data Isolation Examples
- Inspector cannot query admin-only routes (`403` at API layer + RLS blocks direct table access even via Supabase client).
- Contractor A cannot see Contractor B's documents/workers/attendance (`contractor_id` filter in RLS).
- Mine Manager scoped to their assigned mine(s) via `user_roles`; cross-mine queries return empty, not an error, to avoid leaking mine existence.
- Regulator access is opt-in per mine, never implicit.

## 4b. Single Source of Truth for Mine Scope (v2 fix)
v1 had both `profiles.mine_id` and `user_roles.mine_id` — a genuine risk (a stale/incorrectly-set `profiles.mine_id` could silently grant or deny access inconsistent with `user_roles`). **v2 removes `profiles.mine_id` entirely.** `user_roles` is the sole authority for mine scope, enforced at three layers:
1. RLS policies call `fn_user_has_mine_access(mine_id)`, which queries `user_roles` only.
2. API middleware's `hasPermission(user, key, mineId)` also queries `user_roles` only (never touches `profiles` for scope).
3. Code review / contract-freeze rule: no PR may add a scope-bearing column to `profiles`.

## 4c. Contractor Isolation (detailed)
`profiles.contractor_id → contractors.id` is retained as a direct field because it is a 1:1 identity relationship (a contractor user belongs to exactly one contractor company), unlike mine access which is genuinely multi-valued. Every contractor-scoped RLS policy filters on `contractors.id = (SELECT contractor_id FROM profiles WHERE id = auth.uid())`, covering: own contractor record, own workers, own documents, own contract, own attendance records, and compliance/document-expiry views derived from those. A contractor never receives rows where this predicate is false — verified in contract tests (§ below).

## 4d. Offline / Mobile Sync Security
Mobile-originated writes (`client_operation_id`-bearing tables) still go through the same auth + permission + RLS path as any other write — offline capability changes *when* a write happens, not *who* is allowed to make it. `client_operation_id` prevents duplicate inserts on retry but is never used as an authorization signal.

## 5. File/Document Security
Supabase Storage buckets are **private by default**. Access via short-lived signed URLs generated server-side after a permission check — see STORAGE.md.

## 6. Audit Logging
Every create/update/delete on governance-relevant tables (compliance, inspections, corrective actions, incidents, contractors, documents, grievances, users/roles) writes an `audit_logs` row via a shared `logAudit()` helper called from within the same transaction/request as the mutation. Audit logs are append-only (no `UPDATE`/`DELETE` policy granted to any application role).

## 7. Input Validation
Every API route validates request body/query/params with a Zod schema before touching the database. Invalid input returns `400` with field-level details; never partially processed.

## 8. Error Handling
Centralized error formatter strips stack traces, DB error codes, and internal paths from client-facing responses. Full error logged server-side (console/log sink) with a correlation id returned to the client for support/debugging.

## 9. Transport & Headers
HTTPS enforced (Vercel default). Standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) set via Next.js config.

## 10. Out of Scope for This Prototype
Blockchain-based tamper-evidence, biometric attendance, penetration testing, formal compliance certification. Documented here as explicit future enhancements, not gaps hidden from judges.
