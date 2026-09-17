# SIH26024 — Requirements (v2, Approved)
**Status:** Approved by team lead. Supersedes v1. Basis for Phase 1+ implementation.

## 1. Module Map & Priority Tier

| # | Module | Tier | Notes |
|---|---|---|---|
| 1 | Organization Management | MVP | Org→Subsidiary→Region→Mine |
| 2 | Authentication & RBAC | MVP | Supabase Auth + permission tables |
| 3 | Mine Management | MVP | |
| 4 | Compliance Management | MVP | Core governance loop |
| 5 | Inspection Management | MVP | |
| 6 | Safety & Hazard Management | Important | Folded into inspections/observations schema |
| 7 | Corrective Action / CAPA | MVP | Shared by inspections + incidents |
| 8 | Incident Management | MVP | |
| 9 | Contractor Management | MVP | |
| 10 | Worker Management | Important | Contractor sub-entity |
| 11 | Worker Attendance | Important | Demo-friendly, no biometrics |
| 12 | Environmental Monitoring | Important | Configurable thresholds, no unverified regulatory data |
| 13 | Production & Operational Reporting | Important | |
| 14 | Document Management | MVP | Storage + metadata |
| 15 | OCR | Enhancement (interface = MVP) | `OCRService` interface built now; implementation by Account 3 |
| 16 | GIS | MVP | Plain lat/lng |
| 17 | Notifications | MVP (in-app only) | Rules table extensible |
| 18 | Workflow & Approvals | MVP (basic state machine) | |
| 19 | Grievance Management | Enhancement | Lightweight, role-based privacy |
| 20 | Audit Trail | MVP | |
| 21 | AI Risk & Anomaly Engine | Enhancement (interface = MVP) | `AIService` interface + tables now; logic by Account 3 |
| 22 | AI Assistant | Enhancement (interface = MVP) | Same as above |
| 23 | Dashboards | MVP (data layer) | UI by Account 2 |
| 24 | Reports | Important | Basic export/query layer |
| — | Blockchain | Out of scope | Documented as future enhancement only |

**MVP definition (v2, confirmed):** Auth/RBAC, Mine management, Compliance, Inspections, Observations, Corrective actions, Incidents, Contractors, Documents, GIS, Notifications, Workflow, Audit trail, Dashboard data — modules 1–9, 14, 16–18, 20, 23. **Important:** Worker management, Attendance, Environmental monitoring, Production reporting, Reports. **AI/Demo Enhancements:** AI risk scoring, anomaly detection, AI assistant, OCR — interface/stub shipped by Account 1; Account 3 is expected to deliver at least a working risk-score + anomaly-detection demo (not stub-only) since AI is central to the SIH value proposition — see AI_SPEC.md §7.

## 2. New Functional Requirements (this revision)

| ID | Requirement |
|---|---|
| FR-16 | Environmental readings (air/dust/water/noise/land) logged per mine/location with configurable thresholds and status |
| FR-17 | Production summaries per mine/period with target vs actual and operational indicators |
| FR-18 | Worker attendance (check-in/out, status, optional geo) per contractor worker |
| FR-19 | Grievance submission, assignment, resolution, with role-based visibility |
| FR-20 | OCR abstracted behind `OCRService` — no provider lock-in |
| FR-21 | AI failures must never block compliance/inspection/incident/CAPA/approval/dashboard core paths |
| FR-22 | Offline mobile field reporting for inspections/observations/incidents/safety observations/attendance, with idempotent, duplicate-safe sync |
| FR-23 | `user_roles` is the sole source of mine-scope authorization; no redundant scope field elsewhere |
| FR-24 | Contract tests cover auth, mine-scope, and per-module authorization for all MVP endpoints |

## 3. Non-Functional Requirements — unchanged from v1, plus:

| ID | Requirement |
|---|---|
| NFR-11 | Environmental/production/attendance data explicitly marked as demo/configurable, not verified regulatory fact |
| NFR-12 | OCR and AI both sit behind interfaces; Account 1 ships zero hard Gemini dependencies in core business logic |

## 4. Everything else (roles, security model, GIS/OCR/notification strategy, branching, handoff strategy, Definition of Done)
Unchanged in substance from v1 — see `ARCHITECTURE.md`, `ROLES.md`, `SECURITY.md`, `AI_SPEC.md`, `HANDOFF.md` for current authoritative detail. This file tracks *what* is required; those files track *how* it's built.
