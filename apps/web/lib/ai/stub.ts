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
import { identifyOverdue } from "../services/compliance";
import { sanitizeUntrustedInput } from "./security";

export const STUB_MODEL_VERSION = "coalguard-rules-v2.1-deterministic";

/**
 * Deterministic baseline risk indicator engine.
 * Computes an explainable score from 0 to 100 based on verified mine data.
 */
export async function computeDeterministicRiskScore(
  db: Db,
  mineId: string,
  asOf = new Date()
): Promise<{
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: { label: string; weight: number }[];
  recommendedActions: string[];
}> {
  const [records, inspections, incidents] = await Promise.all([
    db.listComplianceRecords(mineId),
    db.listInspectionsByMine(mineId),
    db.listIncidentsByMine(mineId),
  ]);

  // Load observations for inspections
  const observationsList = await Promise.all(
    inspections.map((i) => db.listObservationsByInspection(i.id).catch(() => []))
  );
  const observations = observationsList.flat();

  // Load corrective actions for these sources
  const inspectionIds = inspections.map((i) => i.id);
  const incidentIds = incidents.map((i) => i.id);
  const recordIds = records.map((r) => r.id);

  const [inspCapas, incCapas, compCapas] = await Promise.all([
    inspectionIds.length > 0 ? db.listCorrectiveActionsBySource("INSPECTION", inspectionIds).catch(() => []) : [],
    incidentIds.length > 0 ? db.listCorrectiveActionsBySource("INCIDENT", incidentIds).catch(() => []) : [],
    recordIds.length > 0 ? db.listCorrectiveActionsBySource("COMPLIANCE", recordIds).catch(() => []) : [],
  ]);
  const capas = [...inspCapas, ...incCapas, ...compCapas];

  // 1. Compliance rate & overdue count
  const compliantCount = records.filter((r) => r.status === "COMPLIANT").length;
  const complianceRate = records.length === 0 ? 100 : Math.round((compliantCount / records.length) * 100);
  const overdueRecords = identifyOverdue(records, asOf);
  const overdueCount = overdueRecords.length;

  // 2. Observations severity
  const criticalObs = observations.filter((o) => o.severity === "CRITICAL").length;
  const highObs = observations.filter((o) => o.severity === "HIGH").length;
  const mediumObs = observations.filter((o) => o.severity === "MEDIUM").length;

  // 3. Incidents
  const openIncidents = incidents.filter((i) => i.status !== "CLOSED");
  const criticalIncidents = openIncidents.filter((i) => i.severity === "CRITICAL").length;
  const highIncidents = openIncidents.filter((i) => i.severity === "HIGH").length;

  // 4. CAPA backlog
  const openCapas = capas.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS" || c.status === "OVERDUE");
  const overdueCapas = capas.filter((c) => c.status === "OVERDUE");

  // Factors calculation
  const complianceDeficit = Math.max(0, 100 - complianceRate);
  const complianceWeight = Math.min(35, Math.round(complianceDeficit * 0.35 + overdueCount * 5));
  const observationWeight = Math.min(40, criticalObs * 12 + highObs * 6 + mediumObs * 2);
  const incidentWeight = Math.min(25, criticalIncidents * 12 + highIncidents * 6 + openIncidents.length * 3);
  const capaWeight = Math.min(15, overdueCapas.length * 5 + openCapas.length * 2);

  const rawScore = complianceWeight + observationWeight + incidentWeight + capaWeight;
  const score = Math.min(100, Math.max(0, rawScore));

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 75) riskLevel = "CRITICAL";
  else if (score >= 50) riskLevel = "HIGH";
  else if (score >= 25) riskLevel = "MEDIUM";

  const factors = [
    { label: "Compliance Posture & Overdue Records", weight: complianceWeight },
    { label: "Inspection Findings & Severity", weight: observationWeight },
    { label: "Active Safety Incidents", weight: incidentWeight },
    { label: "Corrective Action Backlog", weight: capaWeight },
  ].filter((f) => f.weight > 0);

  if (factors.length === 0) {
    factors.push({ label: "Nominal Operations Baseline", weight: 0 });
  }

  const recommendedActions: string[] = [];
  if (overdueCount > 0) {
    recommendedActions.push(`Immediately clear ${overdueCount} statutory compliance requirement(s) pending renewal.`);
  }
  if (criticalObs > 0) {
    recommendedActions.push(`Dispatch safety engineer to address ${criticalObs} CRITICAL observation(s) from recent inspections.`);
  }
  if (openIncidents.length > 0) {
    recommendedActions.push(`Expedite inquiry and preventive closure on ${openIncidents.length} active incident investigation(s).`);
  }
  if (overdueCapas.length > 0) {
    recommendedActions.push(`Enforce executive escalation on ${overdueCapas.length} overdue corrective action(s) past deadline.`);
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("Maintain standard shift-level statutory safety logs and scheduled maintenance routines.");
  }

  return { score, riskLevel, factors, recommendedActions };
}

/**
 * Deterministic fallback implementation of AIService.
 * Strictly flags all outputs with `isSimulated: true`.
 */
export class StubAIService implements AIService {
  constructor(private db: Db) {}

  async analyzeComplianceRisk(input: ComplianceRiskInput): Promise<ComplianceRiskResult> {
    const { score, riskLevel, factors, recommendedActions } = await computeDeterministicRiskScore(
      this.db,
      input.mineId
    );

    return {
      score,
      riskLevel,
      factors,
      recommendedActions,
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }

  async analyzeInspection(input: InspectionAnalysisInput): Promise<InspectionAnalysisResult> {
    const inspection = await this.db.getInspection(input.inspectionId);
    if (!inspection) {
      return {
        summary: "Inspection record not found.",
        flaggedObservationIds: [],
        isSimulated: true,
        modelVersion: STUB_MODEL_VERSION,
      };
    }

    const observations = await this.db.listObservationsByInspection(input.inspectionId);
    const criticalOrHigh = observations.filter((o) => o.severity === "CRITICAL" || o.severity === "HIGH");
    const flaggedObservationIds = criticalOrHigh.map((o) => o.id);

    const summary = observations.length === 0
      ? `Inspection (${inspection.inspectionType}) completed with no recorded negative observations.`
      : `Inspection (${inspection.inspectionType}) recorded ${observations.length} observation(s), including ${
          observations.filter((o) => o.severity === "CRITICAL").length
        } critical and ${
          observations.filter((o) => o.severity === "HIGH").length
        } high severity finding(s) requiring remediation.`;

    return {
      summary,
      flaggedObservationIds,
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }

  async detectAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
    const [records, inspections, incidents] = await Promise.all([
      this.db.listComplianceRecords(input.mineId),
      this.db.listInspectionsByMine(input.mineId),
      this.db.listIncidentsByMine(input.mineId),
    ]);

    const anomalies: { description: string; confidence: number }[] = [];

    // Check 1: Spike in overdue records
    const overdue = records.filter((r) => r.status === "OVERDUE");
    if (overdue.length >= 2) {
      anomalies.push({
        description: `Unusual accumulation of overdue statutory compliance records (${overdue.length} items overdue).`,
        confidence: 0.92,
      });
    }

    // Check 2: Recent incident clustering
    const recentIncidents = incidents.filter((i) => i.status !== "CLOSED");
    if (recentIncidents.length >= 2) {
      anomalies.push({
        description: `High incident concentration detected (${recentIncidents.length} active investigations concurrent).`,
        confidence: 0.88,
      });
    }

    // Check 3: Critical observation prevalence
    const obsPromises = inspections.map((i) => this.db.listObservationsByInspection(i.id).catch(() => []));
    const allObs = (await Promise.all(obsPromises)).flat();
    const criticalObs = allObs.filter((o) => o.severity === "CRITICAL");
    if (criticalObs.length >= 2) {
      anomalies.push({
        description: `Elevated frequency of CRITICAL safety findings (${criticalObs.length} critical observations noted).`,
        confidence: 0.95,
      });
    }

    if (anomalies.length === 0) {
      anomalies.push({
        description: "Standard operational indicators within normal statistical variation limits.",
        confidence: 0.85,
      });
    }

    return {
      anomalies,
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }

  async summarizeMine(input: MineSummaryInput): Promise<MineSummaryResult> {
    const mines = await this.db.listMines("ALL");
    const mine = mines.find((m) => m.id === input.mineId);

    const [records, inspections, incidents] = await Promise.all([
      this.db.listComplianceRecords(input.mineId),
      this.db.listInspectionsByMine(input.mineId),
      this.db.listIncidentsByMine(input.mineId),
    ]);

    const compliant = records.filter((r) => r.status === "COMPLIANT").length;
    const score = records.length === 0 ? 100 : Math.round((compliant / records.length) * 100);
    const activeIncidents = incidents.filter((i) => i.status !== "CLOSED").length;

    const summary = `${mine ? mine.name : "Mine"} operates under a compliance score of ${score}%. Current tracking shows ${records.length} regulatory requirement(s), ${inspections.length} recorded inspection cycle(s), and ${activeIncidents} active incident(s) undergoing supervisory review. Priority attention is recommended for unresolved corrective actions.`;

    return {
      summary,
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }

  async analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult> {
    return {
      extractedText: "STATUTORY COMPLIANCE CERTIFICATE - DGMS / MOEFCC APPROVAL\nReference: DGMS/EZ/PERMIT/2026/0491\nSubject: Safe Operational Clearance\nValidity: Annual Renewal Required.",
      classification: "compliance certificate",
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }

  async answerAssistantQuery(input: AssistantQueryInput, ctx?: AuthContext): Promise<AssistantQueryResult> {
    const cleanQuery = sanitizeUntrustedInput(input.query);

    const lower = cleanQuery.toLowerCase();

    // Refusal checks for credentials, SQL injection, or security boundary violations
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
        answer: "Access Denied: In accordance with CoalGuard AI governance security standards, system credentials, database keys, SQL commands, and unauthorized cross-entity records cannot be queried or disclosed.",
        isSimulated: true,
        modelVersion: STUB_MODEL_VERSION,
      };
    }


    if (input.mineId) {
      const mines = await this.db.listMines("ALL");
      const mine = mines.find((m) => m.id === input.mineId);
      return {
        answer: `Under authorized scope for ${mine?.name ?? "the requested mine"}, current governance logs show operational monitoring is active. For detailed regulatory metrics, consult the AI Risk Analysis panel or the Inspections registry.`,
        isSimulated: true,
        modelVersion: STUB_MODEL_VERSION,
      };
    }

    return {
      answer: "CoalGuard AI Assistant active. You have access to governance, safety inspections, compliance records, and incident tracking for all mines authorized under your designated role.",
      isSimulated: true,
      modelVersion: STUB_MODEL_VERSION,
    };
  }
}
