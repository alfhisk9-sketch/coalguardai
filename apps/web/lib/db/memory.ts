import { randomUUID } from "node:crypto";
import type { Db, AuditEntry, NotificationRecord, DocumentRecord } from "./types";
import type {
  Mine, ComplianceRequirement, ComplianceRecord, Inspection, InspectionObservation,
  Incident, Contractor, CorrectiveAction,
} from "@sih/types";

/**
 * In-memory fake used ONLY in tests. Implements the same Db interface the real
 * SupabaseDb (lib/db/supabase.ts) implements, so service-layer tests exercise the
 * real business logic (validation, authz, idempotency) without a live database.
 * This does NOT substitute for the RLS smoke tests already run against real Postgres
 * (see supabase/migrations + scripts/rls_smoke_test.sql) — those prove the DB-level
 * boundary; these prove the API/service-level logic on top of it.
 */
export class MemoryDb implements Db {
  mines: Mine[] = [];
  complianceRequirements: ComplianceRequirement[] = [];
  complianceRecords: ComplianceRecord[] = [];
  inspections: Inspection[] = [];
  observations: InspectionObservation[] = [];
  correctiveActions: CorrectiveAction[] = [];
  incidents: Incident[] = [];
  contractors: Contractor[] = [];
  workers: { id: string; contractorId: string; fullName: string }[] = [];
  documents: DocumentRecord[] = [];
  notifications: NotificationRecord[] = [];
  auditLogs: AuditEntry[] = [];

  async listMines(mineIds: string[] | "ALL") {
    if (mineIds === "ALL") return this.mines;
    return this.mines.filter((m) => mineIds.includes(m.id));
  }
  async createMine(input: Omit<Mine, "id">) {
    const row: Mine = { id: randomUUID(), ...input };
    this.mines.push(row);
    return row;
  }

  async createComplianceRequirement(input: Omit<ComplianceRequirement, "id">) {
    const row: ComplianceRequirement = { id: randomUUID(), ...input };
    this.complianceRequirements.push(row);
    return row;
  }
  async listComplianceRecords(mineId: string) {
    return this.complianceRecords.filter((r) => r.mineId === mineId);
  }
  async updateComplianceRecord(id: string, patch: Partial<ComplianceRecord>) {
    const idx = this.complianceRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("not found");
    const updated = { ...this.complianceRecords[idx]!, ...patch };
    this.complianceRecords[idx] = updated;
    return updated;
  }
  async getComplianceRecord(id: string) {
    return this.complianceRecords.find((r) => r.id === id) ?? null;
  }

  async findInspectionByClientOpId(clientOperationId: string) {
    return this.inspections.find((i) => i.clientOperationId === clientOperationId) ?? null;
  }
  async createInspection(input: Omit<Inspection, "id">) {
    const row: Inspection = { id: randomUUID(), ...input };
    this.inspections.push(row);
    return row;
  }
  async getInspection(id: string) {
    return this.inspections.find((i) => i.id === id) ?? null;
  }
  async listInspectionsByMine(mineId: string) {
    return this.inspections.filter((i) => i.mineId === mineId);
  }
  async updateInspection(id: string, patch: Partial<Inspection>) {
    const idx = this.inspections.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("not found");
    const updated = { ...this.inspections[idx]!, ...patch };
    this.inspections[idx] = updated;
    return updated;
  }
  async findObservationByClientOpId(clientOperationId: string) {
    return this.observations.find((o) => o.clientOperationId === clientOperationId) ?? null;
  }
  async createObservation(input: Omit<InspectionObservation, "id">) {
    const row: InspectionObservation = { id: randomUUID(), ...input };
    this.observations.push(row);
    return row;
  }

  async listObservationsByInspection(inspectionId: string) {
    return this.observations.filter((o) => o.inspectionId === inspectionId);
  }

  async createCorrectiveAction(input: Omit<CorrectiveAction, "id">) {
    const row: CorrectiveAction = { id: randomUUID(), ...input };
    this.correctiveActions.push(row);
    return row;
  }
  async listCorrectiveActionsBySource(sourceType: CorrectiveAction["sourceType"] | "ALL", sourceIds: string[] | "ALL") {
    return this.correctiveActions.filter(
      (a) => (sourceType === "ALL" || a.sourceType === sourceType) && (sourceIds === "ALL" || sourceIds.includes(a.sourceId))
    );
  }
  async getCorrectiveAction(id: string) {
    return this.correctiveActions.find((c) => c.id === id) ?? null;
  }
  async updateCorrectiveAction(id: string, patch: Partial<CorrectiveAction>) {
    const idx = this.correctiveActions.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("not found");
    const updated = { ...this.correctiveActions[idx]!, ...patch };
    this.correctiveActions[idx] = updated;
    return updated;
  }

  async findIncidentByClientOpId(clientOperationId: string) {
    return this.incidents.find((i) => i.clientOperationId === clientOperationId) ?? null;
  }
  async createIncident(input: Omit<Incident, "id">) {
    const row: Incident = { id: randomUUID(), ...input };
    this.incidents.push(row);
    return row;
  }
  async listIncidentsByMine(mineId: string) {
    return this.incidents.filter((i) => i.mineId === mineId);
  }

  async createContractor(input: Omit<Contractor, "id">) {
    const row: Contractor = { id: randomUUID(), ...input };
    this.contractors.push(row);
    return row;
  }
  async listContractorsByMine(mineId: string) {
    return this.contractors.filter((c) => c.mineId === mineId);
  }
  async getContractor(id: string) {
    return this.contractors.find((c) => c.id === id) ?? null;
  }
  async listContractorWorkers(contractorId: string) {
    return this.workers.filter((w) => w.contractorId === contractorId);
  }

  async createDocument(input: Omit<DocumentRecord, "id">) {
    const row: DocumentRecord = { id: randomUUID(), ...input };
    this.documents.push(row);
    return row;
  }
  async listDocuments(ownerType: string, ownerId: string) {
    return this.documents.filter((d) => d.ownerType === ownerType && d.ownerId === ownerId);
  }

  async listNotifications(userId: string) {
    return this.notifications.filter((n) => n.userId === userId);
  }
  async markNotificationRead(id: string, userId: string) {
    const n = this.notifications.find((x) => x.id === id && x.userId === userId);
    if (n) n.isRead = true;
  }

  async logAudit(entry: AuditEntry) {
    this.auditLogs.push(entry);
  }
  async listAuditLogs() {
    return this.auditLogs;
  }
}
