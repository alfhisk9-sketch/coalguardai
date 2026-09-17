import { z } from "zod";
import type {
  ComplianceRiskResult,
  InspectionAnalysisResult,
  AnomalyDetectionResult,
  MineSummaryResult,
  DocumentAnalysisResult,
  AssistantQueryResult,
} from "@sih/types";

export const geminiRiskResponseSchema = z.object({
  score: z.number().min(0).max(100),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  factors: z.array(
    z.object({
      label: z.string(),
      weight: z.number(),
    })
  ),
  recommendedActions: z.array(z.string()),
});

export const geminiInspectionResponseSchema = z.object({
  summary: z.string(),
  flaggedObservationIds: z.array(z.string()),
});

export const geminiAnomalyResponseSchema = z.object({
  anomalies: z.array(
    z.object({
      description: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export const geminiMineSummaryResponseSchema = z.object({
  summary: z.string(),
});

export const geminiDocumentResponseSchema = z.object({
  extractedText: z.string(),
  classification: z.string().nullable(),
  expiryDate: z.string().optional(),
  issuer: z.string().optional(),
  documentNumber: z.string().optional(),
});

export const geminiAssistantResponseSchema = z.object({
  answer: z.string(),
});

export type GeminiRiskResponse = z.infer<typeof geminiRiskResponseSchema>;
export type GeminiInspectionResponse = z.infer<typeof geminiInspectionResponseSchema>;
export type GeminiAnomalyResponse = z.infer<typeof geminiAnomalyResponseSchema>;
export type GeminiMineSummaryResponse = z.infer<typeof geminiMineSummaryResponseSchema>;
export type GeminiDocumentResponse = z.infer<typeof geminiDocumentResponseSchema>;
export type GeminiAssistantResponse = z.infer<typeof geminiAssistantResponseSchema>;
