# DATABASE.md

Postgres via Supabase. All tables: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` (trigger-maintained), `created_by uuid references profiles(id)` where applicable. Soft delete via `deleted_at timestamptz null` on business entities (not on audit_logs). Naming: snake_case, plural table names.

## 1. Organization

```
organizations(id, name, code, created_at, updated_at)
subsidiaries(id, organization_id fk, name, code)
regions(id, subsidiary_id fk, name, code)
mines(id, region_id fk, name, code, mine_type enum[OPEN_CAST,UNDERGROUND,MIXED], latitude, longitude, status enum[ACTIVE,INACTIVE], deleted_at)
```

## 2. Users & RBAC

```
profiles(id pk = auth.users.id, full_name, email, phone, contractor_id fk nullable, is_active bool)
roles(id, key enum[SUPER_ADMIN,CORPORATE_ADMIN,MINE_MANAGER,INSPECTOR,CONTRACTOR,REGULATOR], name)
permissions(id, key text unique, description)   -- e.g. 'compliance.manage'
role_permissions(role_id fk, permission_id fk, primary key(role_id, permission_id))
user_roles(user_id fk profiles, role_id fk, mine_id fk nullable)  -- SOLE source of mine scope
```
**`profiles` has no `mine_id` column.** Mine scope is authoritative only through `user_roles`. This was a v1 design flaw (two possible sources of truth) fixed in v2 — see SECURITY.md §2. `profiles.contractor_id` is retained (not a mine-scope field; see §6 for why it's safe as a direct link).

User's effective permission set = union of `role_permissions` for all `user_roles` rows, optionally scoped to a mine. A query needing "what mines can this user see" always does `SELECT mine_id FROM user_roles WHERE user_id = ...` (or org-wide bypass for SUPER_ADMIN/CORPORATE_ADMIN) — never reads a cached mine id off `profiles`.

## 3. Compliance

```
compliance_categories(id, name, description)
compliance_requirements(id, mine_id fk, category_id fk, title, description, regulatory_authority, frequency enum[ONE_TIME,DAILY,WEEKLY,MONTHLY,QUARTERLY,ANNUAL], responsible_role_id fk, responsible_user_id fk nullable, priority enum[LOW,MEDIUM,HIGH,CRITICAL], is_demo_content bool default true)
compliance_records(id, requirement_id fk, mine_id fk, due_date, completed_date nullable, status enum[COMPLIANT,DUE_SOON,OVERDUE,NON_COMPLIANT,UNDER_REVIEW,NOT_APPLICABLE], notes)
compliance_evidence(id, record_id fk, document_id fk, uploaded_by fk)
compliance_actions(id, record_id fk, description, assigned_to fk, deadline, status enum[OPEN,IN_PROGRESS,COMPLETED,VERIFIED], escalated bool default false)
```
Indexes: `compliance_records(mine_id, status)`, `compliance_records(due_date)`.

## 4. Inspections

```
inspection_templates(id, name, mine_type nullable, items jsonb)  -- checklist definition
inspections(id, mine_id fk, inspector_id fk, template_id fk nullable, inspection_type, scheduled_date, actual_date nullable, latitude, longitude, status enum[SCHEDULED,IN_PROGRESS,SUBMITTED,REVIEWED,APPROVED,REJECTED], client_operation_id uuid nullable, client_created_at timestamptz nullable, sync_status enum[SYNCED,PENDING,CONFLICT] default 'SYNCED')
inspection_items(id, inspection_id fk, label, response, is_compliant bool nullable)
inspection_observations(id, inspection_id fk, description, severity enum[LOW,MEDIUM,HIGH,CRITICAL], latitude, longitude, photo_document_id fk nullable, client_operation_id uuid nullable, client_created_at timestamptz nullable, sync_status enum[SYNCED,PENDING,CONFLICT] default 'SYNCED')
corrective_actions(id, source_type enum[INSPECTION,INCIDENT,COMPLIANCE], source_id uuid, issue, responsible_user_id fk, deadline, priority enum[LOW,MEDIUM,HIGH,CRITICAL], status enum[OPEN,IN_PROGRESS,COMPLETED,VERIFIED,OVERDUE], completion_evidence_id fk nullable, verified_by fk nullable, verified_at nullable)
```
`corrective_actions` is polymorphic (`source_type`+`source_id`) so it's reused by inspections, incidents, and compliance rather than three duplicated tables.

## 5. Incidents & Safety

```
incident_types(id, name, description)
incidents(id, mine_id fk, incident_type_id fk, occurred_at, latitude, longitude, description, severity enum[LOW,MEDIUM,HIGH,CRITICAL], reported_by fk, status enum[REPORTED,UNDER_INVESTIGATION,RESOLVED,CLOSED], client_operation_id uuid nullable, client_created_at timestamptz nullable, sync_status enum[SYNCED,PENDING,CONFLICT] default 'SYNCED')
incident_evidence(id, incident_id fk, document_id fk)
safety_observations(id, mine_id fk, observed_by fk, description, latitude, longitude, severity enum[LOW,MEDIUM,HIGH,CRITICAL], status, client_operation_id uuid nullable, client_created_at timestamptz nullable, sync_status enum[SYNCED,PENDING,CONFLICT] default 'SYNCED')
hazards(id, mine_id fk, title, description, risk_level enum[LOW,MEDIUM,HIGH,CRITICAL], status enum[OPEN,MITIGATED,CLOSED])
risk_assessments(id, mine_id fk, hazard_id fk nullable, assessed_by fk, likelihood int, severity int, risk_score int, notes)
```

## 6. Contractors & Workers

```
contractors(id, mine_id fk, company_name, registration_no, contact_name, contact_email, contact_phone, status enum[ACTIVE,SUSPENDED,TERMINATED])
contractor_contracts(id, contractor_id fk, start_date, end_date, scope, value numeric nullable)
contractor_workers(id, contractor_id fk, full_name, id_number, role_title)
contractor_documents(id, contractor_id fk, document_id fk, doc_type, expiry_date nullable)
```
`contractor_compliance` is derived (a view/query over `compliance_records` filtered by contractor-linked mine + document expiry), not a separate table — avoids duplicated status tracking.

**Contractor isolation model:** `profiles.contractor_id → contractors.id` is the single link a CONTRACTOR-role user has. Every contractor-scoped table (`contractor_workers`, `contractor_documents`, `contractor_contracts`, `worker_attendance` via `contractor_workers.contractor_id`) is filtered in RLS by `contractors.id = profiles.contractor_id` for the requesting user — never by mine alone, since two contractors can share a mine. `contractor_id` is safe as a direct `profiles` field (unlike `mine_id`) because a contractor user has exactly one contractor employer, not a set of scoped assignments — there is no multi-contractor analogue to "inspector works two mines."

## 7. Worker Attendance (new)

```
worker_attendance(id, worker_id fk contractor_workers, mine_id fk, attendance_date date, check_in timestamptz nullable, check_out timestamptz nullable, status enum[PRESENT,ABSENT,HALF_DAY,ON_LEAVE], latitude nullable, longitude nullable, source enum[MANUAL,MOBILE_APP], recorded_by fk, client_operation_id uuid nullable, sync_status enum[SYNCED,PENDING,CONFLICT] default 'SYNCED')
```
No biometric fields. Index: `(worker_id, attendance_date)` unique.

## 7b. Offline Sync / Idempotency (applies to §5, §6, §7 tables above)

Every table above carries:
- `client_operation_id uuid nullable` — generated on-device (mobile UUID v4) at creation time, unique per row via `UNIQUE(client_operation_id) WHERE client_operation_id IS NOT NULL`. This is the idempotency key: a retried sync `POST` with the same `client_operation_id` returns the existing row (`200`) instead of inserting a duplicate (`409` avoided by design — see API.md).
- `client_created_at` — device-local timestamp at creation, preserved even though the row's own `created_at` reflects server insert time. Both are kept so ordering/audit can distinguish "when it happened" from "when it arrived."
- `sync_status` — `PENDING` set by a background/batch sync endpoint if a record is accepted provisionally (e.g., before an attached photo has finished uploading); `SYNCED` once complete; `CONFLICT` reserved for the rare case the same entity was edited both offline and by another user before sync (resolution: server version wins, conflicting local edit surfaced back to the mobile client for manual re-apply — no automatic merge, per the "practical, not distributed-sync" mandate).

Entities requiring `client_operation_id`: **inspections, inspection_observations, incidents, safety_observations, worker_attendance** — i.e. exactly the field-created, offline-capable records. Server-only entities (compliance records, corrective actions, contractor records, etc.) do not need it since they aren't created offline.

## 8. Environmental Monitoring (new)

```
environmental_monitoring_points(id, mine_id fk, name, latitude, longitude, parameter_type enum[AIR_QUALITY,DUST,WATER,NOISE,LAND])
environmental_readings(id, monitoring_point_id fk, parameter_type enum[AIR_QUALITY,DUST,WATER,NOISE,LAND], value numeric, unit text, threshold_value numeric nullable, status enum[NORMAL,WARNING,EXCEEDED], recorded_at, recorded_by fk, evidence_document_id fk nullable, is_demo_content bool default true)
```
`threshold_value` is configurable per point/org — never a hardcoded regulatory constant (per Rule 12 / NFR-11).

## 9. Production & Operational Reporting (new)

```
production_reports(id, mine_id fk, period_start date, period_end date, target_quantity numeric, actual_quantity numeric, unit text default 'tonnes', status enum[DRAFT,SUBMITTED,APPROVED], submitted_by fk)
operational_indicators(id, production_report_id fk, indicator_name, value numeric, unit text)
```

## 10. Grievances (new)

```
grievances(id, mine_id fk, submitted_by fk, category, title, description, priority enum[LOW,MEDIUM,HIGH], status enum[OPEN,IN_PROGRESS,RESOLVED,CLOSED], assigned_to fk nullable, resolution text nullable, is_confidential bool default true)
grievance_evidence(id, grievance_id fk, document_id fk)
```
`is_confidential` drives RLS: submitter, assignee, and MINE_MANAGER+ only by default.

## 11. Documents

```
documents(id, mine_id fk, owner_type enum[COMPLIANCE,INSPECTION,INCIDENT,CONTRACTOR,GRIEVANCE,ENVIRONMENTAL,OTHER], owner_id uuid nullable, storage_path, file_name, mime_type, uploaded_by fk, processing_status enum[NONE,PENDING,PROCESSED,FAILED] default 'NONE', extracted_text text nullable, ocr_result jsonb nullable)
document_versions(id, document_id fk, version_no, storage_path, uploaded_by fk)
```

## 12. Notifications

```
notifications(id, user_id fk, title, body, type, related_entity_type nullable, related_entity_id uuid nullable, is_read bool default false)
notification_rules(id, trigger_key text unique, description, is_active bool default true)  -- e.g. 'compliance.due_soon'
```

## 13. Workflow

```
tasks(id, title, assigned_to fk, related_entity_type, related_entity_id, due_date nullable, status enum[OPEN,IN_PROGRESS,DONE])
approvals(id, entity_type, entity_id, requested_by fk, approver_id fk nullable, status enum[PENDING,APPROVED,REJECTED], decided_at nullable, comment nullable)
workflow_events(id, entity_type, entity_id, from_state, to_state, actor_id fk, occurred_at)
```

## 14. Audit

```
audit_logs(id, actor_id fk nullable, role_key, action text, entity_type, entity_id uuid nullable, previous_data jsonb nullable, new_data jsonb nullable, ip_address inet nullable, occurred_at timestamptz default now())
```
Append-only; no update/delete policy granted to any role via API.

## 15. AI (interfaces, populated by Account 3)

```
risk_scores(id, mine_id fk, entity_type, entity_id uuid, score numeric, factors jsonb, computed_at, model_version text)
anomaly_events(id, mine_id fk, entity_type, entity_id uuid nullable, description, confidence numeric, detected_at, status enum[NEW,REVIEWED,DISMISSED])
ai_analysis_results(id, entity_type, entity_id uuid, analysis_type, result jsonb, model_version text, created_at)
ai_recommendations(id, mine_id fk nullable, entity_type nullable, entity_id uuid nullable, recommendation text, priority enum[LOW,MEDIUM,HIGH], status enum[NEW,ACCEPTED,DISMISSED])
```

## 16. RLS Summary (full policy SQL delivered in Phase 3/4 migrations)

- Every mine-scoped table: row visible if `auth.uid()` has a `user_roles` entry granting access to that `mine_id` **(never `profiles.mine_id` — that column does not exist)**, OR role is `SUPER_ADMIN`/`CORPORATE_ADMIN` (org-wide), OR `REGULATOR` with explicit `regulator_mine_access` grant (table added in Phase 3 if needed).
- `contractors`/`contractor_*`/`worker_attendance` (via worker→contractor): contractor-role users see only rows where `contractors.id = profiles.contractor_id`. Cross-contractor access is impossible by construction — the policy predicate never references `mine_id` alone for contractor tables.
- `grievances`: confidential rows restricted to submitter + assignee + MINE_MANAGER and above.
- `audit_logs`: read-only, visible to roles with `audit.view` permission.

All mine-scope checks route through a single SQL helper function `fn_user_has_mine_access(mine_id uuid) returns boolean`, defined once and reused in every policy — so the "single source of truth" rule is enforced by the schema itself, not just by convention.

## 17. Indexing Policy

Every foreign key indexed. Every `status`/`due_date`/`occurred_at`/`recorded_at` column used in dashboard filters indexed. Composite indexes added where a query filters by `(mine_id, status)` or `(mine_id, date_range)` — finalized against real dashboard queries in Phase 6.
