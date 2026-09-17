# C3_ANALYSIS.md: CoalGuard AI — C3 Comprehensive Engineering Analysis

**Author:** Claude / AI Agent Account 3 (Final Engineering Account)  
**Date:** 2026-09-17  
**Project:** CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  
**Problem Statement:** SIH26024 (Ministry of Coal / Coal India Limited)  
**Baseline Status:**  
- Web Typecheck: **PASS** (`tsc --noEmit`)  
- Mobile Typecheck: **PASS** (`tsc --noEmit`)  
- Web Lint: **PASS** (`next lint` — 0 warnings, 0 errors)  
- Web Tests: **74 passed** (9 test files)  
- Mobile Tests: **15 passed** (1 test file)  
- Total Baseline Tests: **89 passed**  
- Production Web Build: **PASS** (24 pages + 24 API routes generated)  
- Live Supabase: **NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION**  
- Expo Runtime: **NOT VERIFIED — RUNTIME RUN NOT EXECUTED**  

---

## 1. Current Architecture

The CoalGuard AI codebase is organized as a pnpm/npm workspace monorepo:
```
apps/
  web/                     Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide, Recharts, Leaflet
  mobile/                  Expo 51, React Native 0.74, TypeScript, SecureStore, AsyncStorage, Camera, Location
packages/
  types/                   Shared TypeScript interfaces (AuthContext, Mine, Compliance, AI & OCR interfaces)
  validation/              Shared Zod schemas for forms and API validation
  config/                  PermissionKey and RoleKey definitions, role-permission matrix
  ui/                      Shared UI components (if needed across apps)
supabase/
  migrations/              0001 to 0011 SQL schema (RBAC, compliance, inspections, incidents, AI, RLS)
  seed/                    Demo data seeding scripts
docs/                      Specifications, handoffs, and architectural guidelines
```

Key Architectural Principles:
1. **Single Backend Surface:** Next.js Route Handlers (`apps/web/app/api/*`) serve both web and mobile clients. No separate Node/Express backend is required.
2. **Defense-in-Depth Authorization:** 
   - Database layer: Row-Level Security (RLS) policies driven by `fn_user_has_mine_access()` and `fn_user_has_permission()`.
   - API layer: `getAuthContext()` resolves roles and permissions from `user_roles` (never cached on `profiles`), checked via `assertPermission()` and `assertMineAccess()`.
   - Contractor isolation: Filtered by `profiles.contractor_id = contractors.id`.
3. **AI Non-Blocking Enrichment:** AI (`AIService`) and OCR (`OCRService`) are strictly additive. If Gemini or an AI service is unreachable, disabled, or fails, the core governance workflows (inspection submission, incident reporting, CAPA creation, approvals) proceed normally without throwing errors.
4. **Data Truthfulness:** Simulated or rule-based outputs are clearly badged (`isSimulated: true`, `modelVersion`), and never presented as official regulatory findings or live Gemini outputs unless verified.

---

## 2. C1 Capabilities (Foundation & Backend)

C1 established the initial architecture, database schema, and core services:
- **RBAC & Authorization:** 6 roles (`SUPER_ADMIN`, `CORPORATE_ADMIN`, `MINE_MANAGER`, `INSPECTOR`, `CONTRACTOR`, `REGULATOR`), 18 permission keys, and single-source-of-truth mine scoping via `user_roles`.
- **Database Abstraction (`Db`):** Provided `lib/db/types.ts` with two implementations: `SupabaseDb` (Postgres queries) and `MemoryDb` (in-memory mock double for hermetic unit testing).
- **Core Domain Services:**
  - `mines.ts`: mine listing, retrieval, access verification.
  - `compliance.ts`: requirements, records, status transitions, overdue computation (`identifyOverdue`).
  - `inspections.ts`: inspection creation, observation recording, approval workflows.
  - `incidents.ts`: incident creation, severity tracking, status management.
  - `corrective-actions.ts`: polymorphic CAPA creation and verification.
  - `contractors.ts`: contractor listing, worker verification with isolation.
  - `documents.ts`: document metadata registration.
  - `dashboard.ts`: basic role dashboard aggregation.
  - `audit.ts`: immutable `audit_logs` logging helper.
- **Contract Tests:** 43 unit and contract tests verifying permissions, mine scoping, and business rules.

---

## 3. C2 Capabilities (Web Frontend & Mobile)

C2 delivered the web UI, offline-first mobile app, and necessary read-endpoint extensions:
- **Web App (24 Pages):**
  - Responsive shell with role-based navigation filtering (`lib/nav.ts`).
  - Unified data loading, error, and empty states via `useAsync` and `data-states.tsx`.
  - Five role-specific dashboards (`Corporate`, `Mine Manager`, `Inspector`, `Contractor`, `Regulator`).
  - Detailed domain pages: `/mines`, `/mines/[id]`, `/map` (Leaflet/OSM), `/compliance`, `/corrective-actions`, `/inspections`, `/inspections/[id]`, `/observations`, `/incidents`, `/contractors`, `/contractors/[id]`, `/documents`, `/notifications`, `/audit`, `/reports`, `/admin`.
  - Demo-badged modules for unbacked endpoints: `/workers`, `/attendance`, `/environmental`, `/production`, and `/grievances` list.
- **Backend Read Endpoints (7 Additions):**
  - Added `GET /api/me`, `GET /api/inspections`, `GET /api/incidents`, `GET /api/inspections/:id/observations`, `GET /api/contractors`, `GET /api/corrective-actions`.
  - Added `listObservationsByInspection`, `listContractorsByMine`, and `listCorrectiveActionsBySource` to `Db`, `MemoryDb`, and `SupabaseDb`.
- **Mobile App (`apps/mobile`):**
  - Offline queue state machine (`src/lib/queue.ts`) with durable AsyncStorage persistence, retry capability, and 15 passing unit tests.
  - Parent/child dependency resolution (observations wait for inspections to sync before resolving parent IDs).
  - Photo isolation (photo upload failures do not fail or regress the synced inspection record).
  - Field screens: Login, Home, Inspection (GPS + Camera + Observations), Incident Report, Attendance.
  - Secure authentication token storage via `expo-secure-store`.

---

## 4. Existing AI Interfaces

Defined in `packages/types/src/index.ts` (Frozen Contract):
```typescript
export interface ComplianceRiskInput { mineId: string; }
export interface ComplianceRiskResult {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: { label: string; weight: number }[];
  recommendedActions: string[];
  isSimulated: boolean;
  modelVersion: string;
}

export interface InspectionAnalysisInput { inspectionId: string; }
export interface InspectionAnalysisResult {
  summary: string;
  flaggedObservationIds: string[];
  isSimulated: boolean;
  modelVersion: string;
}

export interface AnomalyDetectionInput { mineId: string; }
export interface AnomalyDetectionResult {
  anomalies: { description: string; confidence: number }[];
  isSimulated: boolean;
  modelVersion: string;
}

export interface MineSummaryInput { mineId: string; }
export interface MineSummaryResult {
  summary: string;
  isSimulated: boolean;
  modelVersion: string;
}

export interface DocumentAnalysisInput { documentId: string; }
export interface DocumentAnalysisResult {
  extractedText: string;
  classification: string | null;
  isSimulated: boolean;
  modelVersion: string;
}

export interface AssistantQueryInput {
  query: string;
  mineId?: string;
}
export interface AssistantQueryResult {
  answer: string;
  isSimulated: boolean;
  modelVersion: string;
}

export interface AIService {
  analyzeComplianceRisk(input: ComplianceRiskInput): Promise<ComplianceRiskResult>;
  analyzeInspection(input: InspectionAnalysisInput): Promise<InspectionAnalysisResult>;
  detectAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult>;
  summarizeMine(input: MineSummaryInput): Promise<MineSummaryResult>;
  analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult>;
  answerAssistantQuery(input: AssistantQueryInput): Promise<AssistantQueryResult>;
}

export interface OCRService {
  extractText(input: { documentId: string }): Promise<{ text: string; confidence: number }>;
  extractStructuredData(input: { documentId: string; schemaHint?: string }): Promise<{ data: Record<string, unknown>; confidence: number }>;
  classifyDocument(input: { documentId: string }): Promise<{ documentType: string; confidence: number }>;
}
```

---

## 5. Existing Database AI Tables

Created in `supabase/migrations/0010_notifications_workflow_audit_ai.sql`:
1. `risk_scores`:
   - Columns: `id`, `mine_id` (fk mines), `entity_type`, `entity_id`, `score`, `factors` (jsonb), `computed_at`, `model_version`.
2. `anomaly_events`:
   - Columns: `id`, `mine_id` (fk mines), `entity_type`, `entity_id`, `description`, `confidence`, `detected_at`, `status` (`NEW`, `REVIEWED`, `DISMISSED`).
3. `ai_analysis_results`:
   - Columns: `id`, `entity_type`, `entity_id`, `analysis_type`, `result` (jsonb), `model_version`, `created_at`.
4. `ai_recommendations`:
   - Columns: `id`, `mine_id` (fk mines), `entity_type`, `entity_id`, `recommendation`, `priority`, `status` (`NEW`, `ACCEPTED`, `DISMISSED`).

---

## 6. Existing Document Tables

Created in `supabase/migrations/0009_documents.sql`:
1. `documents`:
   - Columns: `id`, `mine_id` (fk mines), `owner_type` (`COMPLIANCE`, `INSPECTION`, `INCIDENT`, `CONTRACTOR`, `GRIEVANCE`, `ENVIRONMENTAL`, `OTHER`), `owner_id`, `storage_path`, `file_name`, `mime_type`, `uploaded_by` (fk profiles), `processing_status` (`NONE`, `PENDING`, `PROCESSED`, `FAILED`), `extracted_text`, `ocr_result` (jsonb), `deleted_at`, `created_at`, `updated_at`.
2. `document_versions`:
   - Columns: `id`, `document_id` (fk documents), `version_no`, `storage_path`, `uploaded_by`, `created_at`.
3. Foreign Keys referencing documents:
   - `compliance_evidence.document_id`
   - `inspection_observations.photo_document_id`
   - `corrective_actions.completion_evidence_id`
   - `incident_evidence.document_id`
   - `contractor_documents.document_id`
   - `environmental_readings.evidence_document_id`
   - `grievance_evidence.document_id`

---

## 7. Existing API Routes

All route handlers live under `apps/web/app/api/`:
- Auth / Profile: `/api/me`
- Mines: `/api/mines`
- Dashboard: `/api/dashboard/[mineId]`
- Compliance: `/api/compliance/records`, `/api/compliance/records/[id]`, `/api/compliance/requirements`
- Inspections: `/api/inspections`, `/api/inspections/[id]/observations`, `/api/inspections/[id]/approve`
- Incidents: `/api/incidents`
- Corrective Actions: `/api/corrective-actions`, `/api/corrective-actions/[id]/verify`
- Contractors: `/api/contractors`, `/api/contractors/[id]/workers`
- Documents: `/api/documents`
- Notifications: `/api/notifications`, `/api/notifications/[id]`
- Audit: `/api/audit`
- Lighter Tier (POST-only): `/api/attendance`, `/api/environmental/readings`, `/api/production/reports`, `/api/grievances`
- **Currently Missing:** `/api/ai/*` (risk, inspection, anomaly, mine-summary, document, assistant).

---

## 8. Existing Frontend AI Mount Points

1. `apps/web/components/common/ai-panel.tsx`:
   - Mounted on Corporate / Super Admin dashboard (`components/dashboard/corporate-dashboard.tsx`).
   - Mounted on Mine Manager dashboard (`components/dashboard/mine-dashboard.tsx`).
   - Mounted on Mine Detail Overview (`app/(app)/mines/[id]/page.tsx`).
   - Currently renders a static fallback stating AI is not yet available.
2. Natural Extension Mount Points:
   - `/inspections/[id]`: Display AI inspection summary and highlight flagged observations.
   - `/observations`: Display badge/highlight on AI-flagged observations.
   - `/documents`: Display OCR extraction, classification, and document expiry intelligence.
   - `/assistant`: Dedicated full-page interactive AI Assistant with strict RBAC boundary and refusal safeguards.

---

## 9. Existing Mobile Capabilities

- Framework: React Native with Expo 51.
- State Machine: `src/lib/queue.ts` handling `PENDING`, `SYNCING`, `SYNCED`, `FAILED`.
- Persistence: Durable in `AsyncStorage`, auth tokens in `SecureStore`.
- Operations: Inspections, Observations, Incidents, Attendance with GPS and Camera capture.
- Photo isolation: Preserves inspection synchronization even if binary image transfer fails.
- Extensibility: Can surface AI insights post-sync cleanly via existing API wrapper.

---

## 10. Remaining Blockers & Technical Debt

1. **Missing AI Implementation:** Neither Gemini AI provider nor stub AI service is implemented in `apps/web/lib/services`.
2. **Missing AI API Routes:** No route handlers under `/api/ai/*`.
3. **Hardcoded `criticalObservations: 0`:** In `lib/services/dashboard.ts`, `MineDashboard.criticalObservations` is hardcoded to 0 instead of computing actual critical observations.
4. **Binary Storage Upload:** `/api/documents` only registers metadata; binary upload/signed URL generation is not wired to Supabase Storage.
5. **Read Endpoints for Lighter-Tier Tables:** Environmental readings, production reports, attendance, and grievances list lack read endpoints, causing the frontend pages to rely on `mock.ts`.
6. **AI Assistant Navigation Entry:** `/assistant` page does not exist and is not listed in `lib/nav.ts`.
7. **Prompt Injection / Untrusted Input Risk:** AI input contexts need sanitization and bounding against prompt injection.

---

## 11. Proposed C3 Implementation Plan

### Phase 1: Gemini & AI Service Architecture
- Install `@google/genai` or `@google/generative-ai` (pinned, server-side only).
- Implement `GeminiAIService` implementing the frozen `AIService` interface with robust JSON parsing, Zod schema validation, and defensive fallbacks.
- Implement `StubAIService` (deterministic rule-based baseline) returning `isSimulated: true`.
- Implement `AiProviderFactory` toggled by `GEMINI_API_KEY` and `GEMINI_ENABLED`.
- Ensure zero leakage of API keys to client bundles or mobile app.

### Phase 2: Explainable AI Compliance Risk Engine
- Implement `analyzeComplianceRisk()` using real mine metrics:
  - Compliance record history, overdue requirement counts, observation severity weights (CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1), open incident severity, and unresolved CAPA.
  - Deterministic baseline scoring (0-100) mapped to `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - Gemini contextual enhancement for nuanced factor explanations and actionable recommendations.
  - Persist to `risk_scores` table.

### Phase 3: Anomaly Detection Engine
- Implement `detectAnomaly()`:
  - Statistical & rule-based checks: spikes in critical observations, recurring observation patterns, overdue compliance accumulation, incident clustering.
  - Gemini contextual summary for identified anomaly events.
  - Persist to `anomaly_events` table.

### Phase 4: Inspection AI Intelligence
- Implement `analyzeInspection()`:
  - Synthesizes inspection observations, notes, GPS, and severity levels.
  - Generates executive inspection summary and flags specific observation IDs for immediate supervisory attention.
  - Flags reflected in UI without blocking inspection submissions.

### Phase 5: Mine AI Summary
- Implement `summarizeMine()`:
  - Aggregates compliance posture, open CAPA backlog, recent incidents, and active risks into a concise operational executive summary.

### Phase 6: Secure AI Assistant with Strict RBAC
- Implement `answerAssistantQuery()`:
  - Grounded context retrieval based strictly on the caller's authorized mine scope and permissions.
  - Rigid refusal policies: no arbitrary SQL, no credentials/keys exposure, no cross-mine leakage, rejection of prompt injection attempts.
  - Create `/assistant` page and register in `lib/nav.ts`.

### Phase 7 & 8: Document Intelligence, Storage & Expiry
- Implement `OCRService` via Gemini Vision / structured extraction.
- Implement document classification (`compliance certificate`, `inspection report`, `safety certificate`, `permit`, etc.).
- Implement document expiry intelligence: evaluate dates to classify `VALID`, `EXPIRING_SOON`, `EXPIRED` with actionable alerts.
- Provide secure file upload and signed download endpoint handling.

### Phase 9: AI API Routes & Typed Client
- Create route handlers under `apps/web/app/api/ai/`:
  - `/api/ai/risk`, `/api/ai/inspection`, `/api/ai/anomaly`, `/api/ai/mine-summary`, `/api/ai/document`, `/api/ai/assistant`.
- Create typed client `apps/web/lib/api/ai.ts` using existing `apiGet`/`apiPost`.

### Phase 10: AI UI / UX Upgrade
- Upgrade `apps/web/components/common/ai-panel.tsx` to handle Loading, Success, Error, Unavailable, and Simulated states.
- Clearly badge `Gemini AI (modelVersion)` vs `Simulated / Demo AI`.
- Integrate AI cards into Corporate Dashboard, Mine Manager Dashboard, Mine Detail, Inspection Detail, Observations, Documents, and Assistant.

### Phase 11: Backend & Data Quality Fixes
- Fix `criticalObservations` in `lib/services/dashboard.ts`.
- Add clean read endpoints for high-value modules (environmental, production, attendance) to replace mocks where feasible.

### Phase 12: Branding, Testing & Final Verification
- Update branding to **CoalGuard AI** (Ministry of Coal / Coal India Limited).
- Add comprehensive automated test suite for AI services, determinism, validation, prompt injection defense, and UI components.
- Run full QA gate: `tsc`, `lint`, `test`, `build`.
- Complete final documentation (`C3_HANDOFF.md`, `FINAL_RELEASE.md`, `DEMO_GUIDE.md`).

---

## 12. Risks and Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Gemini API Failure / Rate Limit / Missing Key** | High | Core workflows never depend on AI. Graceful fallback to `StubAIService` or `{ meta: { aiUnavailable: true } }`. Clearly communicate status in UI. |
| **Prompt Injection via Documents or Chat** | Critical | Treat all user/document text as untrusted. Strictly bound prompts, use system instructions, and enforce server-side data authorization before model inference. |
| **Model Hallucination of Regulatory Limits** | High | Never claim AI scores are official statutory thresholds; display explicit decision-support disclaimers. Flagged IDs must match real DB IDs. |
| **N+1 Gemini API Overhead on Dashboards** | Medium | In-memory / cache hashing layer for risk scores and summaries; do not invoke Gemini on every sub-component render. |
| **Breaking Existing C1/C2 Contracts** | High | Preserve all types in `@sih/types`, schemas in `@sih/validation`, and existing 89 tests. Run continuous test checks after each change. |

---

## 13. Files Expected to Change / Be Created

### New Files:
- `apps/web/lib/ai/gemini.ts` (Gemini SDK client & prompt engine)
- `apps/web/lib/ai/stub.ts` (Deterministic fallback AI service)
- `apps/web/lib/ai/service.ts` (Provider abstraction & factory)
- `apps/web/lib/ai/ocr.ts` (OCR and document intelligence service)
- `apps/web/lib/ai/cache.ts` (Freshness cache & signal hasher)
- `apps/web/lib/ai/security.ts` (Prompt injection defense & context sanitization)
- `apps/web/app/api/ai/risk/route.ts`
- `apps/web/app/api/ai/inspection/route.ts`
- `apps/web/app/api/ai/anomaly/route.ts`
- `apps/web/app/api/ai/mine-summary/route.ts`
- `apps/web/app/api/ai/document/route.ts`
- `apps/web/app/api/ai/assistant/route.ts`
- `apps/web/lib/api/ai.ts` (Typed client for web components)
- `apps/web/app/(app)/assistant/page.tsx` (AI Assistant page)
- `apps/web/tests/ai.test.ts` (Comprehensive AI test suite)
- `docs/C3_ANALYSIS.md` (This file)
- `docs/AI_IMPLEMENTATION.md`
- `docs/AI_SECURITY.md`
- `docs/DEMO_GUIDE.md`
- `docs/FINAL_RELEASE.md`

### Modified Files:
- `apps/web/package.json` (Add `@google/genai` or `@google/generative-ai`)
- `packages/validation/src/index.ts` (Add AI request validation schemas)
- `apps/web/components/common/ai-panel.tsx` (Full interactive AI panel with simulated/live states)
- `apps/web/components/dashboard/corporate-dashboard.tsx` (Wire AI risk & anomalies)
- `apps/web/components/dashboard/mine-dashboard.tsx` (Wire AI risk, anomalies, recommendations)
- `apps/web/app/(app)/mines/[id]/page.tsx` (Wire AI mine summary)
- `apps/web/app/(app)/inspections/[id]/page.tsx` (Wire inspection AI & flagged observations)
- `apps/web/app/(app)/documents/page.tsx` (Wire document intelligence, OCR, expiry badges)
- `apps/web/lib/nav.ts` (Add AI Assistant navigation item)
- `apps/web/lib/services/dashboard.ts` (Fix `criticalObservations: 0`)
- `apps/web/app/layout.tsx` / branding components (Branding as CoalGuard AI)
- `.env.example` (Update with any new server-side AI configs)
- `docs/C3_HANDOFF.md` (Final handoff report)
