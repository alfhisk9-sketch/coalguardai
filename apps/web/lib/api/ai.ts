import type {
  ComplianceRiskResult,
  InspectionAnalysisResult,
  AnomalyDetectionResult,
  MineSummaryResult,
  DocumentAnalysisResult,
  AssistantQueryResult,
} from "@sih/types";
import { apiPost } from "./client";

export const aiApi = {
  analyzeRisk: (mineId: string) =>
    apiPost<ComplianceRiskResult>("/api/ai/risk", { mineId }),

  analyzeInspection: (inspectionId: string) =>
    apiPost<InspectionAnalysisResult>("/api/ai/inspection", { inspectionId }),

  detectAnomaly: (mineId: string) =>
    apiPost<AnomalyDetectionResult>("/api/ai/anomaly", { mineId }),

  summarizeMine: (mineId: string) =>
    apiPost<MineSummaryResult>("/api/ai/mine-summary", { mineId }),

  analyzeDocument: (documentId: string) =>
    apiPost<DocumentAnalysisResult>("/api/ai/document", { documentId }),

  askAssistant: (query: string, mineId?: string) =>
    apiPost<AssistantQueryResult>("/api/ai/assistant", { query, mineId }),
};
