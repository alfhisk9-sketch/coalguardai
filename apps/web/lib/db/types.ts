import type {
  Mine, ComplianceRequirement, ComplianceRecord, Inspection, InspectionObservation,
  Incident, Contractor, CorrectiveAction,
} from "@sih/types";

export interface AuditEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  previousData?: unknown;
  newData?: unknown;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
}

export interface DocumentRecord {
  id: string;
  mineId: string | null;
  ownerType: string;
  ownerId: string | null;
  storagePath: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
}

export interface Db {
  // mines
  listMines(mineIds: string[] | "ALL"): Promise<Mine[]>;
  createMine(input: Omit<Mine, "id"> ): Promise<Mine>;

  // compliance
  createComplianceRequirement(input: Omit<ComplianceRequirement, "id">): Promise<ComplianceRequirement>;
  listComplianceRecords(mineId: string): Promise<ComplianceRecord[]>;
  updateComplianceRecord(id: string, patch: Partial<ComplianceRecord>): Promise<ComplianceRecord>;
  getComplianceRecord(id: string): Promise<ComplianceRecord | null>;

  // inspections
  findInspectionByClientOpId(clientOperationId: string): Promise<Inspection | null>;
  createInspection(input: Omit<Inspection, "id">): Promise<Inspection>;
  getInspection(id: string): Promise<Inspection | null>;
  updateInspection(id: string, patch: Partial<Inspection>): Promise<Inspection>;
  listInspectionsByMine(mineId: string): Promise<Inspection[]>;
  findObservationByClientOpId(clientOperationId: string): Promise<InspectionObservation | null>;
  createObservation(input: Omit<InspectionObservation, "id">): Promise<InspectionObservation>;
  /** Account 2 minimal integration addition — read side of an existing write-only entity. */
  listObservationsByInspection(inspectionId: string): Promise<InspectionObservation[]>;

  // corrective actions
  createCorrectiveAction(input: Omit<CorrectiveAction, "id">): Promise<CorrectiveAction>;
  /** Account 2 minimal integration addition. */
  listCorrectiveActionsBySource(sourceType: CorrectiveAction["sourceType"] | "ALL", sourceIds: string[] | "ALL"): Promise<CorrectiveAction[]>;
  getCorrectiveAction(id: string): Promise<CorrectiveAction | null>;
  updateCorrectiveAction(id: string, patch: Partial<CorrectiveAction>): Promise<CorrectiveAction>;

  // incidents
  findIncidentByClientOpId(clientOperationId: string): Promise<Incident | null>;
  createIncident(input: Omit<Incident, "id">): Promise<Incident>;
  listIncidentsByMine(mineId: string): Promise<Incident[]>;

  // contractors
  createContractor(input: Omit<Contractor, "id">): Promise<Contractor>;
  getContractor(id: string): Promise<Contractor | null>;
  /** Account 2 minimal integration addition. */
  listContractorsByMine(mineId: string): Promise<Contractor[]>;
  listContractorWorkers(contractorId: string): Promise<{ id: string; contractorId: string; fullName: string; idNumber?: string | null; roleTitle?: string | null }[]>;

  // documents
  createDocument(input: Omit<DocumentRecord, "id">): Promise<DocumentRecord>;
  listDocuments(ownerType: string, ownerId: string): Promise<DocumentRecord[]>;

  // notifications
  listNotifications(userId: string): Promise<NotificationRecord[]>;
  markNotificationRead(id: string, userId: string): Promise<void>;

  // audit
  logAudit(entry: AuditEntry): Promise<void>;
  listAuditLogs(): Promise<AuditEntry[]>;
}
