import { GoogleGenAI } from "@google/genai";
import type {
  AIService,
  ComplianceRiskInput,
  ComplianceRiskResult,
  InspectionAnalysisInput,
  InspectionAnalysisResult,
  AnomalyDetectionInput,
  AnomalyDetectionResult,
  MineSummaryInput,
  MineSummaryResult,
  DocumentAnalysisInput,
  DocumentAnalysisResult,
  AssistantQueryInput,
  AssistantQueryResult,
  AuthContext,
} from "@sih/types";
import type { Db } from "../db/types";
import { computeDeterministicRiskScore, StubAIService } from "./stub";
import {
  geminiRiskResponseSchema,
  geminiInspectionResponseSchema,
  geminiAnomalyResponseSchema,
  geminiMineSummaryResponseSchema,
  geminiAssistantResponseSchema,
} from "./types";
import { CORE_SYSTEM_SECURITY_INSTRUCTIONS, sanitizeUntrustedInput, wrapUntrustedContext } from "./security";
import { getCachedAiResult, hashSignal, setCachedAiResult } from "./cache";
import {
  persistRiskResult,
  persistAnomalyResult,
  persistInspectionAnalysis,
  persistMineSummary,
} from "./persistence";

export const GEMINI_MODEL_VERSION = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export class GeminiAIService implements AIService {
  private ai: GoogleGenAI | null = null;
  private stub: StubAIService;

  constructor(private db: Db) {
    this.stub = new StubAIService(db);
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && process.env.GEMINI_ENABLED !== "false") {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.error("[CoalGuard AI] Failed to initialize GoogleGenAI client:", err);
      }
    }
  }

  isLive(): boolean {
    return this.ai !== null;
  }

  private async callGeminiJson<T>(prompt: string, schema: { parse: (val: unknown) => T }): Promise<T | null> {
    if (!this.ai) return null;
    try {
      let response;
      try {
        response = await this.ai.models.generateContent({
          model: GEMINI_MODEL_VERSION,
          contents: prompt,
          config: {
            systemInstruction: CORE_SYSTEM_SECURITY_INSTRUCTIONS,
            responseMimeType: "application/json",
            temperature: 0.2, // low temperature for analytical determinism
          },
        });
      } catch (err: any) {
        if (err?.message?.includes("gemini-3.6-flash") || err?.status === 404) {
          response = await this.ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              systemInstruction: CORE_SYSTEM_SECURITY_INSTRUCTIONS,
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });
        } else {
          throw err;
        }
      }

      const rawText = response.text?.trim() ?? "";
      if (!rawText) return null;

      const parsed = JSON.parse(rawText);
      return schema.parse(parsed);
    } catch (err) {
      console.warn("[CoalGuard AI] Gemini API call degraded, falling back to deterministic engine:", err);
      return null;
    }
  }

  async analyzeComplianceRisk(input: ComplianceRiskInput): Promise<ComplianceRiskResult> {
    // 1. Compute deterministic baseline metrics first
    const baseline = await computeDeterministicRiskScore(this.db, input.mineId);
    const signalHash = hashSignal(baseline);
    const cacheKey = `risk:${input.mineId}`;

    // 2. Check cache
    const cached = getCachedAiResult<ComplianceRiskResult>(cacheKey, signalHash);
    if (cached) return cached;

    // 3. If Gemini is not available, return deterministic stub result
    if (!this.ai) {
      const stubResult = await this.stub.analyzeComplianceRisk(input);
      setCachedAiResult(cacheKey, stubResult, signalHash);
      await persistRiskResult(input.mineId, stubResult);
      return stubResult;
    }

    // 4. Enrich baseline with Gemini contextual factor analysis
    const prompt = `
Analyze the following verified coal mine operational risk indicators and generate an explainable risk breakdown.
Anchor the score around the verified deterministic calculation: Base Score = ${baseline.score}, Level = ${baseline.riskLevel}.

Verified Mine Signals:
- Calculated Baseline Score: ${baseline.score}/100
- Proposed Risk Level: ${baseline.riskLevel}
- Contributing Metric Factors: ${JSON.stringify(baseline.factors)}
- Primary Action Indicators: ${JSON.stringify(baseline.recommendedActions)}

Return strict JSON conforming to:
{
  "score": ${baseline.score},
  "riskLevel": "${baseline.riskLevel}",
  "factors": [
    { "label": "string", "weight": number }
  ],
  "recommendedActions": [
    "string"
  ]
}
`.trim();

    const result = await this.callGeminiJson(prompt, geminiRiskResponseSchema);
    if (!result) {
      const stubFallback = await this.stub.analyzeComplianceRisk(input);
      setCachedAiResult(cacheKey, stubFallback, signalHash);
      await persistRiskResult(input.mineId, stubFallback);
      return stubFallback;
    }

    const liveResult: ComplianceRiskResult = {
      score: result.score,
      riskLevel: result.riskLevel,
      factors: result.factors,
      recommendedActions: result.recommendedActions,
      isSimulated: false,
      modelVersion: GEMINI_MODEL_VERSION,
    };

    setCachedAiResult(cacheKey, liveResult, signalHash);
    await persistRiskResult(input.mineId, liveResult);
    return liveResult;
  }

  async analyzeInspection(input: InspectionAnalysisInput): Promise<InspectionAnalysisResult> {
    const inspection = await this.db.getInspection(input.inspectionId);
    if (!inspection) {
      return this.stub.analyzeInspection(input);
    }

    const observations = await this.db.listObservationsByInspection(input.inspectionId);
    const cacheKey = `inspection:${input.inspectionId}`;
    const signalHash = hashSignal({ inspection, observations });

    const cached = getCachedAiResult<InspectionAnalysisResult>(cacheKey, signalHash);
    if (cached) return cached;

    if (!this.ai) {
      const stubResult = await this.stub.analyzeInspection(input);
      setCachedAiResult(cacheKey, stubResult, signalHash);
      await persistInspectionAnalysis(input.inspectionId, stubResult);
      return stubResult;
    }

    const obsContext = observations.map((o) => ({
      id: o.id,
      severity: o.severity,
      description: sanitizeUntrustedInput(o.description),
    }));

    const prompt = `
Analyze the safety inspection findings for an active coal mine.
Inspection Type: ${inspection.inspectionType}
Scheduled/Actual Date: ${inspection.actualDate ?? inspection.scheduledDate ?? "N/A"}
Status: ${inspection.status}

Recorded Observations:
${JSON.stringify(obsContext, null, 2)}

Instructions:
1. Provide a concise executive synthesis of the inspection findings.
2. Flag observation IDs that represent critical safety hazards or require immediate statutory remediation.
3. Every ID in 'flaggedObservationIds' MUST EXACTLY MATCH an ID from the input observations. Do NOT invent IDs.

Return strict JSON:
{
  "summary": "concise executive summary string",
  "flaggedObservationIds": ["matching-uuid-1", "matching-uuid-2"]
}
`.trim();

    const result = await this.callGeminiJson(prompt, geminiInspectionResponseSchema);
    if (!result) {
      const stubFallback = await this.stub.analyzeInspection(input);
      setCachedAiResult(cacheKey, stubFallback, signalHash);
      await persistInspectionAnalysis(input.inspectionId, stubFallback);
      return stubFallback;
    }

    // Ensure flagged IDs actually exist in the observation set
    const validIds = new Set(observations.map((o) => o.id));
    const verifiedFlaggedIds = result.flaggedObservationIds.filter((id) => validIds.has(id));

    const liveResult: InspectionAnalysisResult = {
      summary: result.summary,
      flaggedObservationIds: verifiedFlaggedIds,
      isSimulated: false,
      modelVersion: GEMINI_MODEL_VERSION,
    };

    setCachedAiResult(cacheKey, liveResult, signalHash);
    await persistInspectionAnalysis(input.inspectionId, liveResult);
    return liveResult;
  }

  async detectAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
    const [records, inspections, incidents] = await Promise.all([
      this.db.listComplianceRecords(input.mineId),
      this.db.listInspectionsByMine(input.mineId),
      this.db.listIncidentsByMine(input.mineId),
    ]);

    const signalHash = hashSignal({ records, inspections, incidents });
    const cacheKey = `anomaly:${input.mineId}`;

    const cached = getCachedAiResult<AnomalyDetectionResult>(cacheKey, signalHash);
    if (cached) return cached;

    if (!this.ai) {
      const stubResult = await this.stub.detectAnomaly(input);
      setCachedAiResult(cacheKey, stubResult, signalHash);
      await persistAnomalyResult(input.mineId, stubResult);
      return stubResult;
    }

    const overdueCount = records.filter((r) => r.status === "OVERDUE").length;
    const openIncidents = incidents.filter((i) => i.status !== "CLOSED").length;
    const criticalIncidents = incidents.filter((i) => i.severity === "CRITICAL").length;

    const prompt = `
Analyze operational safety and regulatory trends for mine ID: ${input.mineId}.
Data context:
- Total compliance records: ${records.length}, Overdue: ${overdueCount}
- Recorded inspections: ${inspections.length}
- Open incidents: ${openIncidents}, Critical incidents: ${criticalIncidents}

Identify statistical anomalies or dangerous clustering patterns.
Distinguish subtle anomaly insights from verified regulatory violations. Do not label standard operational variance as severe anomalies.

Return strict JSON:
{
  "anomalies": [
    {
      "description": "string",
      "confidence": number between 0.0 and 1.0
    }
  ]
}
`.trim();

    const result = await this.callGeminiJson(prompt, geminiAnomalyResponseSchema);
    if (!result || result.anomalies.length === 0) {
      const stubFallback = await this.stub.detectAnomaly(input);
      setCachedAiResult(cacheKey, stubFallback, signalHash);
      await persistAnomalyResult(input.mineId, stubFallback);
      return stubFallback;
    }

    const liveResult: AnomalyDetectionResult = {
      anomalies: result.anomalies,
      isSimulated: false,
      modelVersion: GEMINI_MODEL_VERSION,
    };

    setCachedAiResult(cacheKey, liveResult, signalHash);
    await persistAnomalyResult(input.mineId, liveResult);
    return liveResult;
  }

  async summarizeMine(input: MineSummaryInput): Promise<MineSummaryResult> {
    const mines = await this.db.listMines("ALL");
    const mine = mines.find((m) => m.id === input.mineId);

    const [records, inspections, incidents] = await Promise.all([
      this.db.listComplianceRecords(input.mineId),
      this.db.listInspectionsByMine(input.mineId),
      this.db.listIncidentsByMine(input.mineId),
    ]);

    const signalHash = hashSignal({ mine, records, inspections, incidents });
    const cacheKey = `summary:${input.mineId}`;

    const cached = getCachedAiResult<MineSummaryResult>(cacheKey, signalHash);
    if (cached) return cached;

    if (!this.ai) {
      const stubResult = await this.stub.summarizeMine(input);
      setCachedAiResult(cacheKey, stubResult, signalHash);
      await persistMineSummary(input.mineId, stubResult);
      return stubResult;
    }

    const compliant = records.filter((r) => r.status === "COMPLIANT").length;
    const complianceRate = records.length === 0 ? 100 : Math.round((compliant / records.length) * 100);
    const overdueCount = records.filter((r) => r.status === "OVERDUE").length;

    const prompt = `
Generate an executive governance and safety summary for mine "${mine?.name ?? "Coal Mine"}" (Code: ${mine?.code ?? "N/A"}, Type: ${mine?.mineType ?? "OPEN_CAST"}).
Context:
- Compliance Score: ${complianceRate}% (${records.length} requirements tracked, ${overdueCount} overdue)
- Inspections: ${inspections.length} recorded
- Active Incidents: ${incidents.filter((i) => i.status !== "CLOSED").length} open

Provide a 2-3 sentence executive operational brief suitable for high-level monitoring. Focus on current safety posture and priority managerial attention.

Return strict JSON:
{
  "summary": "concise executive summary string"
}
`.trim();

    const result = await this.callGeminiJson(prompt, geminiMineSummaryResponseSchema);
    if (!result) {
      const stubFallback = await this.stub.summarizeMine(input);
      setCachedAiResult(cacheKey, stubFallback, signalHash);
      await persistMineSummary(input.mineId, stubFallback);
      return stubFallback;
    }

    const liveResult: MineSummaryResult = {
      summary: result.summary,
      isSimulated: false,
      modelVersion: GEMINI_MODEL_VERSION,
    };

    setCachedAiResult(cacheKey, liveResult, signalHash);
    await persistMineSummary(input.mineId, liveResult);
    return liveResult;
  }

  async analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    return this.stub.analyzeDocument(input);
  }

  async answerAssistantQuery(input: AssistantQueryInput, ctx?: AuthContext): Promise<AssistantQueryResult> {
    const cleanQuery = sanitizeUntrustedInput(input.query);

    const lower = cleanQuery.toLowerCase();

    // Defense 1: Security and injection checks
    if (
      cleanQuery.includes("[FILTERED_INJECTION_ATTEMPT]") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("credential") ||
      lower.includes("service_role") ||
      lower.includes("api key") ||
      lower.includes("api_key") ||
      lower.includes("drop table") ||
      lower.includes("union select") ||
      lower.includes("select * from") ||
      lower.includes("database master") ||
      lower.includes("other contractor") ||
      lower.includes("another contractor") ||
      lower.includes("confidential worker")
    ) {
      return {
        answer: "Access Denied: In accordance with CoalGuard AI governance security policies, system credentials, database keys, SQL commands, and unauthorized cross-entity records cannot be queried or disclosed.",
        isSimulated: false,
        modelVersion: GEMINI_MODEL_VERSION,
      };
    }

    // Defense 2: Role and mine scoping checks
    if (ctx && input.mineId) {
      const userHasAccess = ctx.roles.some(
        (r) => r.roleKey === "SUPER_ADMIN" || r.roleKey === "CORPORATE_ADMIN" || r.mineId === input.mineId
      );
      if (!userHasAccess) {
        return {
          answer: "Access Denied: Your assigned role does not grant permission to query operational or compliance records for this mine. Please contact your system administrator.",
          isSimulated: false,
          modelVersion: GEMINI_MODEL_VERSION,
        };
      }
    }

    if (!this.ai) {
      return this.stub.answerAssistantQuery(input, ctx);
    }

    // Grounding: Retrieve allowed context
    let contextStr = "System: Multi-mine overview active.";
    if (input.mineId) {
      const mines = await this.db.listMines("ALL");
      const mine = mines.find((m) => m.id === input.mineId);
      const [records, incidents] = await Promise.all([
        this.db.listComplianceRecords(input.mineId),
        this.db.listIncidentsByMine(input.mineId),
      ]);
      contextStr = `Authorized Mine: ${mine?.name ?? "Coal Mine"} (${mine?.code ?? "N/A"})\nCompliance items: ${records.length}\nActive Incidents: ${incidents.filter((i) => i.status !== "CLOSED").length}`;
    }

    const prompt = `
${wrapUntrustedContext("user_query", cleanQuery)}

Authorized Context:
${contextStr}

Instructions:
Answer the user's question accurately using only authorized context and domain knowledge of Indian coal mining safety governance (DGMS regulations, Coal Mines Regulations 2017).
If the query asks for secrets, other mines' private data, or non-permitted actions, refuse politely.

Return strict JSON:
{
  "answer": "helpful, concise, grounded answer"
}
`.trim();

    const result = await this.callGeminiJson(prompt, geminiAssistantResponseSchema);
    if (!result) {
      return this.stub.answerAssistantQuery(input, ctx);
    }

    return {
      answer: result.answer,
      isSimulated: false,
      modelVersion: GEMINI_MODEL_VERSION,
    };
  }
}
