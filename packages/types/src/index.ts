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
  status: "ACTIVE" | "INACTIVE" | "UNDER_INSPECTION" | "SUSPENDED";
  operator?: string;
  state?: string;
  district?: string;
  targetProduction?: number;
  actualProduction?: number;
  workerCount?: number;
  incidentCount?: number;
  complianceScore?: number;
  riskBand?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  environmentalStatus?: "NORMAL" | "WARNING" | "CRITICAL";
  lastInspection?: string;
  isDemo?: boolean;
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
  isDemo?: boolean;
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
  status: "SCHEDULED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED" | "OVERDUE" | "COMPLETED";
  score?: number;
  findingsCount?: number;
  criticalFindings?: number;
  notes?: string;
  isDemo?: boolean;
}

export interface InspectionObservation extends SyncableFields {
  id: string;
  inspectionId: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude: number | null;
  longitude: number | null;
  photoDocumentId: string | null;
  isDemo?: boolean;
}

export interface Incident extends SyncableFields {
  id: string;
  mineId: string;
  incidentTypeId: string | null;
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  title?: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "UNDER_INVESTIGATION" | "RESOLVED" | "CLOSED" | "OPEN" | "ACTION_REQUIRED";
  reportedBy?: string;
  rootCause?: string;
  correctiveAction?: string;
  resolvedAt?: string | null;
  isDemo?: boolean;
}

export interface Contractor {
  id: string;
  mineId: string;
  companyName: string;
  registrationNo?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  workerCount?: number;
  activeWorkers?: number;
  complianceScore?: number;
  status: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  isDemo?: boolean;
}

export interface Worker {
  id: string;
  workerId: string;
  contractorId: string;
  mineId: string;
  fullName: string;
  role: string;
  department: string;
  status: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  joiningDate: string;
  trainingStatus: "COMPLIANT" | "PENDING_REFRESHER" | "OVERDUE";
  lastMedicalDate?: string;
  attendancePercentage?: number;
  isDemo?: boolean;
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
  isDemo?: boolean;
}

export interface EnvironmentalReading {
  id: string;
  monitoringPointId: string;
  parameterType: "AIR_QUALITY" | "DUST" | "WATER" | "NOISE" | "LAND" | "PM25" | "PM10" | "AQI";
  value: number;
  unit: string;
  thresholdValue: number;
  status: "NORMAL" | "WARNING" | "CRITICAL" | "EXCEEDED";
  recordedAt: string;
  isDemo?: boolean;
}

export interface ProductionRecord {
  id: string;
  mineId: string;
  periodStart: string;
  periodEnd: string;
  targetQuantity: number;
  actualQuantity: number;
  unit: string;
  varianceTonnes?: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
  isDemo?: boolean;
}

export interface AISession {
  id: string;
  userId: string;
  mineId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  contextSources?: string[];
  isGrounded?: boolean;
  modelVersion?: string;
  createdAt: string;
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
export interface AISourceItem {
  type: string;
  id?: string;
  label: string;
}

export interface AssistantQueryInput { query: string; mineId?: string; }
export interface AssistantQueryResult {
  answer: string;
  sources?: AISourceItem[];
  grounded?: boolean;
  provider?: "gemini" | "unavailable";
  model?: string;
  isSimulated: boolean;
  modelVersion: string;
  sourceIndicator?: "DATABASE_BACKED" | "REGULATORY_GUIDANCE";
  contextSources?: string[];
}

export interface AIService {
  analyzeComplianceRisk(input: ComplianceRiskInput): Promise<ComplianceRiskResult>;
  analyzeInspection(input: InspectionAnalysisInput): Promise<InspectionAnalysisResult>;
  detectAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult>;
  summarizeMine(input: MineSummaryInput): Promise<MineSummaryResult>;
  analyzeDocument(input: DocumentAnalysisInput): Promise<DocumentAnalysisResult>;
  answerAssistantQuery(input: AssistantQueryInput, ctx?: AuthContext): Promise<AssistantQueryResult>;
}

export interface OCRService {
  extractText(input: { documentId: string }): Promise<{ text: string; confidence: number }>;
  extractStructuredData(input: { documentId: string; schemaHint?: string }): Promise<{ data: Record<string, unknown>; confidence: number }>;
  classifyDocument(input: { documentId: string }): Promise<{ documentType: string; confidence: number }>;
}
