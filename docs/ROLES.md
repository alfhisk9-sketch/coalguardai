# ROLES.md

## Roles

| Role | Scope |
|---|---|
| SUPER_ADMIN | Entire system, all orgs |
| CORPORATE_ADMIN | All subsidiaries/mines within their organization |
| MINE_MANAGER | Assigned mine(s) |
| INSPECTOR | Assigned mine(s), field data creation |
| CONTRACTOR | Own contractor record + linked mine (read-mostly) |
| REGULATOR | Explicitly authorized mines (read-only) |

Role assignment is per-mine via `user_roles(user_id, role_id, mine_id)` — a user can hold different roles at different mines (e.g., INSPECTOR at Mine A, no access at Mine B). `SUPER_ADMIN`/`CORPORATE_ADMIN` rows have `mine_id = null` (org-wide).

**`user_roles` is the only source of mine scope, full stop.** `profiles` carries no `mine_id` column (removed in v2 — two sources of truth was a real risk). Any code, query, or RLS policy that needs "which mines can this user touch" reads `user_roles`, never `profiles`. Contractor users are the one exception: they scope through `profiles.contractor_id → contractors.id`, a distinct, non-mine identity link (see DATABASE.md §6).

## Permission Keys

`dashboard.view, mines.view, mines.manage, compliance.view, compliance.manage, inspections.view, inspections.create, inspections.approve, incidents.view, incidents.create, contractors.view, contractors.manage, reports.view, reports.generate, documents.upload, users.manage, audit.view, ai.view`

## Permission Matrix

| Permission | SUPER_ADMIN | CORPORATE_ADMIN | MINE_MANAGER | INSPECTOR | CONTRACTOR | REGULATOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| mines.view | ✅ | ✅ | ✅ | ✅ | own mine | authorized |
| mines.manage | ✅ | ✅ | own mine | — | — | — |
| compliance.view | ✅ | ✅ | ✅ | ✅ | own | authorized |
| compliance.manage | ✅ | ✅ | own mine | — | — | — |
| inspections.view | ✅ | ✅ | ✅ | own | — | authorized |
| inspections.create | ✅ | — | — | ✅ | — | — |
| inspections.approve | ✅ | ✅ | own mine | — | — | — |
| incidents.view | ✅ | ✅ | ✅ | ✅ | own | authorized |
| incidents.create | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| contractors.view | ✅ | ✅ | ✅ | — | own | authorized |
| contractors.manage | ✅ | ✅ | own mine | — | — | — |
| reports.view | ✅ | ✅ | ✅ | limited | own | authorized |
| reports.generate | ✅ | ✅ | own mine | — | — | — |
| documents.upload | ✅ | ✅ | ✅ | ✅ | own docs | — |
| users.manage | ✅ | subsidiary scope | — | — | — | — |
| audit.view | ✅ | ✅ | own mine | — | — | — |
| ai.view | ✅ | ✅ | ✅ | ✅ | — | ✅ |

"own mine" = restricted to mine(s) present in the user's `user_roles`. "authorized" = REGULATOR requires an explicit grant record; no implicit org-wide access even for regulators.

## Enforcement

1. **RLS** (database) — primary, cannot be bypassed by any client.
2. **API route middleware** — checks `hasPermission(user, key, mineId?)` before executing; returns `403` early. Prevents wasted queries and gives clean error messages.
3. **Grievance confidentiality** is an additional narrower rule on top of the table above: submitter, assignee, and MINE_MANAGER+ only, regardless of general `dashboard.view`.

## Extensibility

New roles: insert into `roles`, assign `role_permissions` rows — zero code changes required in API routes, since checks go through `hasPermission()`, not hardcoded role names.
