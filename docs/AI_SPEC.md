# AI_SPEC.md

## 1. Principle
AI (Gemini, via `AIService`) and OCR (via `OCRService`) are **additive enrichments**, never dependencies of core workflows. Compliance creation, inspection submission, corrective actions, incident reporting, approvals, and basic dashboards must all function with these services fully stubbed/unavailable. This is enforced by construction: no core route imports `AIService`/`OCRService` as a required step — only optional enrichment calls wrapped in try/catch that degrade silently (log + continue) on failure.

## 2. `AIService` Interface (owned by Account 1, implemented by Account 3)

```ts
interface AIService {
  analyzeComplianceRisk(input: ComplianceRiskInput): Promise<ComplianceRiskResult>;
  analyzeInspection(input: InspectionAnalysisInput): Promise<InspectionAnalysisResult>;
  detectAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult>;
  summarizeMine(input: MineSummaryInput): Promise<MineSummaryResult>;
  analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult>;
  answerAssistantQuery(input: AssistantQueryInput): Promise<AssistantQueryResult>;
}
```
All input/output types live in `packages/types/ai.ts`. Account 1 ships a `StubAIService` implementation returning deterministic placeholder data (clearly flagged `isSimulated: true` in the response) so the rest of the app can be built/tested against real shapes before Account 3 wires up Gemini.

## 3. `OCRService` Interface (provider-independent)

```ts
interface OCRService {
  extractText(input: { documentId: string }): Promise<{ text: string; confidence: number }>;
  extractStructuredData(input: { documentId: string; schemaHint?: string }): Promise<{ data: Record<string, unknown>; confidence: number }>;
  classifyDocument(input: { documentId: string }): Promise<{ documentType: string; confidence: number }>;
}
```
Not hard-coded to Gemini — Account 3 may implement it with Gemini's document/vision capability or another provider without changing the interface or any calling code. Account 1 ships a `StubOCRService`.

## 4. Data Flow
1. Caller invokes `AIService`/`OCRService` method (via `/api/ai/*` routes or server-side helper).
2. Result persisted to `ai_analysis_results` / `risk_scores` / `anomaly_events` / `ai_recommendations`, or `documents.extracted_text`/`ocr_result` for OCR.
3. On failure: error logged, request returns `{ data: null, meta: { aiUnavailable: true } }` — callers must handle this gracefully, never throw a blocking error to the user for an AI failure.

## 5. Environment
`GEMINI_API_KEY` read only inside the concrete Gemini implementation (Account 3's code), never in shared packages or core business logic.

## 6. Account 3 Scope (explicit)
Prompt design, Gemini API calls, result parsing/validation, populating `ai_*` tables and `documents.ocr_result`, tuning `AI Assistant` chat behavior, and QA of AI output quality. Account 1's job ends at: interfaces, types, stub implementations, DB tables, and routes that call the interface.

## 7. Minimum AI Demo Bar (raised per team direction — AI is central to SIH value proposition)
A stub is acceptable from Account 1, but **the shipped system must not stop at stub-only AI** — Account 3 is expected to deliver at least:

**AI Risk Score** — `analyzeComplianceRisk` consuming compliance history, overdue requirements, inspection observations, incident history, and corrective-action history for a mine; returning a numeric score, a risk level (LOW/MEDIUM/HIGH/CRITICAL), contributing factors (structured, not just prose), and recommended actions. Persisted to `risk_scores`.

**Anomaly Detection** — `detectAnomaly` applied over demo operational/compliance data to surface unusual patterns (e.g., a mine with a sudden spike in overdue compliance, or observation severity trending up). Persisted to `anomaly_events`.

All AI-generated output is labeled in the UI as AI/demo analysis (via `isSimulated`/`modelVersion` metadata already in the response types) — never presented as verified regulatory fact. This bar is Account 3's responsibility; Account 1's contract (interfaces + tables + non-blocking guarantee, §1) does not change.
