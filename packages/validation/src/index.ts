import { z } from "zod";

// One schema per offline-syncable entity's create payload includes the idempotency fields.
export const syncableFieldsSchema = z.object({
  clientOperationId: z.string().uuid().optional(),
  clientCreatedAt: z.string().datetime().optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const mineCreateSchema = z.object({
  regionId: z.string().uuid(),
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20),
  mineType: z.enum(["OPEN_CAST", "UNDERGROUND", "MIXED"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const complianceRequirementCreateSchema = z.object({
  mineId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  regulatoryAuthority: z.string().max(200).optional(),
  frequency: z.enum(["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const complianceRecordUpdateSchema = z.object({
  status: z.enum(["COMPLIANT", "DUE_SOON", "OVERDUE", "NON_COMPLIANT", "UNDER_REVIEW", "NOT_APPLICABLE"]),
  notes: z.string().max(2000).optional(),
  completedDate: z.string().date().optional(),
});

export const inspectionCreateSchema = syncableFieldsSchema.extend({
  mineId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  inspectionType: z.string().min(2).max(100),
  scheduledDate: z.string().date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const observationCreateSchema = syncableFieldsSchema.extend({
  inspectionId: z.string().uuid(),
  description: z.string().min(3).max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  photoDocumentId: z.string().uuid().optional(),
});

export const incidentCreateSchema = syncableFieldsSchema.extend({
  mineId: z.string().uuid(),
  incidentTypeId: z.string().uuid().optional(),
  occurredAt: z.string().datetime(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  description: z.string().min(3).max(2000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export const correctiveActionCreateSchema = z.object({
  sourceType: z.enum(["INSPECTION", "INCIDENT", "COMPLIANCE"]),
  sourceId: z.string().uuid(),
  issue: z.string().min(3).max(1000),
  responsibleUserId: z.string().uuid().optional(),
  deadline: z.string().date().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const contractorCreateSchema = z.object({
  mineId: z.string().uuid(),
  companyName: z.string().min(2).max(300),
  registrationNo: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
});

export const attendanceCreateSchema = syncableFieldsSchema.extend({
  workerId: z.string().uuid(),
  mineId: z.string().uuid(),
  attendanceDate: z.string().date(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const environmentalReadingCreateSchema = z.object({
  monitoringPointId: z.string().uuid(),
  parameterType: z.enum(["AIR_QUALITY", "DUST", "WATER", "NOISE", "LAND"]),
  value: z.number(),
  unit: z.string().min(1).max(20),
  thresholdValue: z.number().optional(),
});

export const productionReportCreateSchema = z.object({
  mineId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  targetQuantity: z.number().nonnegative(),
  actualQuantity: z.number().nonnegative().optional(),
  unit: z.string().default("tonnes"),
});

export const grievanceCreateSchema = z.object({
  mineId: z.string().uuid(),
  category: z.string().max(100).optional(),
  title: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export type MineCreateInput = z.infer<typeof mineCreateSchema>;
export type ComplianceRequirementCreateInput = z.infer<typeof complianceRequirementCreateSchema>;
export type InspectionCreateInput = z.infer<typeof inspectionCreateSchema>;
export type ObservationCreateInput = z.infer<typeof observationCreateSchema>;
export type IncidentCreateInput = z.infer<typeof incidentCreateSchema>;
export type CorrectiveActionCreateInput = z.infer<typeof correctiveActionCreateSchema>;
export type ContractorCreateInput = z.infer<typeof contractorCreateSchema>;
export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;

// AI request schemas
export const complianceRiskInputSchema = z.object({
  mineId: z.string().uuid(),
});

export const inspectionAnalysisInputSchema = z.object({
  inspectionId: z.string().uuid(),
});

export const anomalyDetectionInputSchema = z.object({
  mineId: z.string().uuid(),
});

export const mineSummaryInputSchema = z.object({
  mineId: z.string().uuid(),
});

export const documentAnalysisInputSchema = z.object({
  documentId: z.string().uuid(),
});

export const assistantQueryInputSchema = z.object({
  query: z.string().min(1).max(2000),
  mineId: z.string().uuid().optional(),
});

