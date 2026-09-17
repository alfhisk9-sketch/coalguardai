import type { PermissionKey, RoleKey } from "@sih/config";

export interface ApiSuccess<T> {
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number; aiUnavailable?: boolean };
}
export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface Mine {
  id: string;
  regionId: string;
  name: string;
  code: string;
  mineType: "OPEN_CAST" | "UNDERGROUND" | "MIXED";
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface UserRoleAssignment {
  roleKey: RoleKey;
  mineId: string | null; // null = org-wide (SUPER_ADMIN / CORPORATE_ADMIN)
}

export interface AuthContext {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  roles: UserRoleAssignment[];
  permissions: PermissionKey[]; // resolved union across all role assignments
  contractorId: string | null;
}

export interface ComplianceRequirement {
  id: string;
  mineId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  regulatoryAuthority: string | null;
  frequency: "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isDemoContent: boolean;
}

export interface ComplianceRecord {
  id: string;
  requirementId: string;
  mineId: string;
  dueDate: string;
  completedDate: string | null;
  status: "COMPLIANT" | "DUE_SOON" | "OVERDUE" | "NON_COMPLIANT" | "UNDER_REVIEW" | "NOT_APPLICABLE";
  notes: string | null;
}

// Base shape shared by every offline-syncable entity (DATABASE.md 7b / MOBILE_SPEC.md).
export interface SyncableFields {
  clientOperationId?: string;
  clientCreatedAt?: string;
  syncStatus?: "SYNCED" | "PENDING" | "CONFLICT";
}

export interface Inspection extends SyncableFields {
  id: string;
  mineId: string;
  inspectorId: string;
  templateId: string | null;
  inspectionType: string;
  scheduledDate: string | null;
  actualDate: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
}

export interface InspectionObservation extends SyncableFields {
  id: string;
  inspectionId: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude: number | null;
  longitude: number | null;
  photoDocumentId: string | null;
}

export interface Incident extends SyncableFields {
  id: string;
  mineId: string;
  incidentTypeId: string | null;
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "UNDER_INVESTIGATION" | "RESOLVED" | "CLOSED";
}

export interface Contractor {
  id: string;
  mineId: string;
  companyName: string;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
}

export interface CorrectiveAction {
  id: string;
  sourceType: "INSPECTION" | "INCIDENT" | "COMPLIANCE";
  sourceId: string;
  issue: string;
  responsibleUserId: string | null;
  deadline: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED" | "OVERDUE";
}

// --- AI interface DTOs (AI_SPEC.md) ---
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
export interface InspectionAnalysisResult { summary: string; flaggedObservationIds: string[]; isSimulated: boolean; modelVersion: string; }
export interface AnomalyDetectionInput { mineId: string; }
export interface AnomalyDetectionResult { anomalies: { description: string; confidence: number }[]; isSimulated: boolean; modelVersion: string; }
export interface MineSummaryInput { mineId: string; }
export interface MineSummaryResult { summary: string; isSimulated: boolean; modelVersion: string; }
export interface DocumentAnalysisInput { documentId: string; }
export interface DocumentAnalysisResult { extractedText: string; classification: string | null; isSimulated: boolean; modelVersion: string; }
export interface AssistantQueryInput { query: string; mineId?: string; }
export interface AssistantQueryResult { answer: string; isSimulated: boolean; modelVersion: string; }

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
