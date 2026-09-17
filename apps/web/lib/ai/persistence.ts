import type {
  ComplianceRiskResult,
  InspectionAnalysisResult,
  AnomalyDetectionResult,
  MineSummaryResult,
  DocumentAnalysisResult,
} from "@sih/types";
import { getSupabaseServerClient } from "../supabase-client";

function getClientSafely() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return getSupabaseServerClient();
  } catch {
    return null;
  }
}

/**
 * Persists AI risk calculation into the `risk_scores` and `ai_recommendations` tables.
 * Silent failure if Supabase is unavailable (non-blocking enrichment).
 */
export async function persistRiskResult(mineId: string, result: ComplianceRiskResult): Promise<void> {
  try {
    const supabase = getClientSafely();
    if (!supabase) return;


    // 1. Insert into risk_scores
    await supabase.from("risk_scores").insert({
      mine_id: mineId,
      entity_type: "MINE",
      entity_id: mineId,
      score: result.score,
      factors: result.factors,
      model_version: result.modelVersion,
    });

    // 2. Insert recommended actions into ai_recommendations
    if (result.recommendedActions && result.recommendedActions.length > 0) {
      const recommendations = result.recommendedActions.map((rec) => ({
        mine_id: mineId,
        entity_type: "MINE",
        entity_id: mineId,
        recommendation: rec,
        priority: result.riskLevel === "CRITICAL" ? "HIGH" : result.riskLevel === "HIGH" ? "MEDIUM" : "LOW",
        status: "NEW",
      }));
      await supabase.from("ai_recommendations").insert(recommendations);
    }
  } catch (err) {
    // Non-blocking: log server-side only
    console.error("[CoalGuard AI] Failed to persist risk score:", err);
  }
}

/**
 * Persists detected anomalies into `anomaly_events`.
 */
export async function persistAnomalyResult(mineId: string, result: AnomalyDetectionResult): Promise<void> {
  try {
    const supabase = getClientSafely();
    if (!supabase || !result.anomalies.length) return;

    const rows = result.anomalies.map((a) => ({
      mine_id: mineId,
      entity_type: "MINE",
      entity_id: mineId,
      description: a.description,
      confidence: a.confidence,
      status: "NEW",
    }));

    await supabase.from("anomaly_events").insert(rows);
  } catch (err) {
    console.error("[CoalGuard AI] Failed to persist anomaly events:", err);
  }
}

/**
 * Persists inspection analysis into `ai_analysis_results`.
 */
export async function persistInspectionAnalysis(inspectionId: string, result: InspectionAnalysisResult): Promise<void> {
  try {
    const supabase = getClientSafely();
    if (!supabase) return;

    await supabase.from("ai_analysis_results").insert({
      entity_type: "INSPECTION",
      entity_id: inspectionId,
      analysis_type: "INSPECTION_SUMMARY",
      result: {
        summary: result.summary,
        flaggedObservationIds: result.flaggedObservationIds,
        isSimulated: result.isSimulated,
      },
      model_version: result.modelVersion,
    });
  } catch (err) {
    console.error("[CoalGuard AI] Failed to persist inspection analysis:", err);
  }
}

/**
 * Persists mine summary into `ai_analysis_results`.
 */
export async function persistMineSummary(mineId: string, result: MineSummaryResult): Promise<void> {
  try {
    const supabase = getClientSafely();
    if (!supabase) return;

    await supabase.from("ai_analysis_results").insert({
      entity_type: "MINE",
      entity_id: mineId,
      analysis_type: "MINE_SUMMARY",
      result: {
        summary: result.summary,
        isSimulated: result.isSimulated,
      },
      model_version: result.modelVersion,
    });
  } catch (err) {
    console.error("[CoalGuard AI] Failed to persist mine summary:", err);
  }
}

/**
 * Persists OCR/document analysis results to the `documents` table.
 */
export async function persistDocumentAnalysis(documentId: string, result: DocumentAnalysisResult): Promise<void> {
  try {
    const supabase = getClientSafely();
    if (!supabase) return;

    await supabase
      .from("documents")
      .update({
        processing_status: "PROCESSED",
        extracted_text: result.extractedText,
        ocr_result: {
          classification: result.classification,
          modelVersion: result.modelVersion,
          isSimulated: result.isSimulated,
        },
      })
      .eq("id", documentId);
  } catch (err) {
    console.error("[CoalGuard AI] Failed to persist document analysis:", err);
  }
}
