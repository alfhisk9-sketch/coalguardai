# AI_IMPLEMENTATION.md: CoalGuard AI Engineering Specifications

**Project:** CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines  
**Owner:** Claude / AI Agent Account 3 (Final Engineering Account)  
**Status:** IMPLEMENTED & TESTED (84 Web Unit/Contract Tests + 15 Mobile Tests Passing)  

---

## 1. Architectural Overview

CoalGuard AI integrates artificial intelligence into coal mining governance as an **additive decision-support enrichment layer**. Core mining operations—such as recording inspection observations, logging safety incidents, submitting corrective actions (CAPA), and verifying statutory compliance—remain 100% resilient and functional even when external AI services or network connectivity are offline.

```
+-------------------------------------------------------------------------+
|                              Next.js Web / Expo Mobile                   |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Route Handlers (/api/ai/*) + Auth Middleware            |
|       (getAuthContext -> assertPermission("ai.view") -> assertMineAccess) |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        AIService Provider Factory                        |
|                                    |                                    |
|             +----------------------+----------------------+             |
|             |                                             |             |
|             v                                             v             |
|    GeminiAIService (gemini-2.5-flash)           StubAIService (Rules)   |
|    - Server-side GEMINI_API_KEY                - Deterministic engine   |
|    - Strict Zod JSON schema validation         - Signal-based scoring   |
|    - Defensive fallback on error               - isSimulated: true      |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|           In-Memory Signal Cache (lib/ai/cache.ts)                      |
|           - SHA-256 Signal Fingerprinting                               |
|           - 10-Minute TTL & Deduplication (Prevents N+1 Costs)          |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|           Persistence Layer (risk_scores, anomaly_events, etc.)          |
+-------------------------------------------------------------------------+
```

---

## 2. Gemini AI Integration (`GeminiAIService`)

- **SDK:** Official `@google/genai` (v0.23.0+).
- **Model:** Pinned to `gemini-2.5-flash` with low temperature (`0.2`) for analytical stability.
- **Security:** `GEMINI_API_KEY` is strictly accessed server-side in Node.js route handlers. It is never included in client JavaScript bundles, local storage, or the Expo mobile application.
- **Provider Selection:** Controlled via `GEMINI_ENABLED` and key availability. When the key is absent or Gemini encounters network/rate limits, the system seamlessly and silently executes the deterministic rule engine (`StubAIService`) without throwing blocking errors to the user.
- **Truthfulness Contract:** Every response explicitly returns `isSimulated: boolean` and `modelVersion: string`. Live outputs display `Gemini AI (gemini-2.5-flash)` while fallbacks display `Simulated Demo AI`.

---

## 3. Explainable AI Risk Scoring Engine (`analyzeComplianceRisk`)

The risk engine generates a composite risk index from 0 (safest) to 100 (maximum statutory risk), categorized into four explainable levels:
- `LOW` (0 – 24)
- `MEDIUM` (25 – 49)
- `HIGH` (50 – 74)
- `CRITICAL` (75 – 100)

### Calculation Formula:
1. **Compliance Factor (Weight: 35 pts):**
   $$\text{Deficit} = \max(0, 100 - \text{ComplianceRate})$$
   $$\text{Factor}_{\text{comp}} = \min(35, \text{round}(\text{Deficit} \times 0.35 + \text{OverdueCount} \times 5))$$
2. **Observation Severity Factor (Weight: 40 pts):**
   $$\text{Factor}_{\text{obs}} = \min(40, \text{CriticalObs} \times 12 + \text{HighObs} \times 6 + \text{MedObs} \times 2)$$
3. **Incident Factor (Weight: 25 pts):**
   $$\text{Factor}_{\text{inc}} = \min(25, \text{CriticalIncidents} \times 12 + \text{HighIncidents} \times 6 + \text{OpenIncidents} \times 3)$$
4. **Corrective Action Backlog Factor (Weight: 15 pts):**
   $$\text{Factor}_{\text{capa}} = \min(15, \text{OverdueCapas} \times 5 + \text{OpenCapas} \times 2)$$
5. **Composite Score:**
   $$\text{Score} = \min(100, \max(0, \text{Factor}_{\text{comp}} + \text{Factor}_{\text{obs}} + \text{Factor}_{\text{inc}} + \text{Factor}_{\text{capa}}))$$

The baseline calculation is 100% deterministic and reproducible across repeated calls for identical data. Gemini enriches the factors with contextual diagnostic text and actionable recommendations.

---

## 4. Anomaly Detection Engine (`detectAnomaly`)

Surfaces operational and safety irregularities using statistical variance checks:
1. **Statutory Overdue Accumulation:** Detects accumulation when 2 or more compliance obligations are overdue ($\ge 92\%$ confidence).
2. **Incident Clustering:** Detects temporal clusters when 2 or more safety incidents remain under concurrent investigation ($\ge 88\%$ confidence).
3. **Critical Observation Spike:** Detects elevation when 2 or more CRITICAL findings are recorded across recent inspection rounds ($\ge 95\%$ confidence).

Anomalies are persisted to the `anomaly_events` table and highlighted on the dashboard.

---

## 5. Inspection AI & Observation Flagging (`analyzeInspection`)

- Consumes inspection details and observation records (`lib/db/types.ts`).
- Generates an executive summary of inspection findings.
- Identifies and flags specific observation UUIDs representing critical hazards.
- **Integrity Rule:** Flagged IDs are strictly constrained to existing database observation IDs—never hallucinated.
- Highlighting in UI: Observations matching flagged IDs receive an alert badge (`AI FLAGGED HAZARD`) and distinct visual styling in `/inspections/[id]`.

---

## 6. Secure AI Assistant (`answerAssistantQuery`)

Accessible at `/assistant`:
- **Context Grounding:** User queries are scoped strictly to authorized mine data based on the caller's `AuthContext` resolved from `user_roles`.
- **Refusal Behavior:** Explicitly refuses requests for system passwords, database secrets, or unauthorized mines.
- **Prompt Injection Defense:** Strips jailbreak patterns and wraps untrusted input in bounded XML delimiters.

---

## 7. OCR & Document Intelligence (`CoalGuardOCRService`)

- **Text Extraction:** Extracts statutory clearance text, approval codes, and regulatory authority references.
- **Classification:** Identifies document types (`compliance certificate`, `inspection report`, `safety certificate`, `permit`, etc.).
- **Expiry Intelligence:**
  - Evaluates remaining days against statutory deadlines.
  - Classifies into `VALID`, `EXPIRING_SOON` ($\le 30$ days), or `EXPIRED`.
  - Generates recommended renewal filing timelines.

---

## 8. Caching & Cost Protection (`lib/ai/cache.ts`)

- In-memory cache with SHA-256 fingerprinting of input telemetry signals.
- 10-minute time-to-live (TTL).
- Automatic eviction capped at 500 entries to prevent memory leaks.
- Prevents redundant Gemini calls during dashboard multi-mine re-renders.
