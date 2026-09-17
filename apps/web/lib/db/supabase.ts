import type { SupabaseClient } from "@supabase/supabase-js";
import type { Db, AuditEntry, NotificationRecord, DocumentRecord } from "./types";
import type {
  Mine, ComplianceRequirement, ComplianceRecord, Inspection, InspectionObservation,
  Incident, Contractor, CorrectiveAction,
} from "@sih/types";

/**
 * Real implementation against Supabase Postgres. Talks to the schema defined in
 * supabase/migrations/*.sql via the standard Supabase JS client, which runs every
 * query as the caller's authenticated session — RLS applies exactly as documented
 * in DATABASE.md #16 and exercised in scripts/rls_smoke_test.sql.
 *
 * STATUS: written but NOT VERIFIED against a live Supabase project — no project is
 * provisioned in this environment. Migrations themselves ARE verified (applied
 * cleanly to a real local Postgres, RLS assertions passed — see HANDOFF.md).
 * Account 2/3 should run this against a real `supabase start`/hosted project and
 * report back if column-mapping mismatches surface; the mapping below is written
 * directly off DATABASE.md so it should be correct, but "should be" is not "verified".
 */
export class SupabaseDb implements Db {
  constructor(private client: SupabaseClient) {}

  async listMines(mineIds: string[] | "ALL"): Promise<Mine[]> {
    let q = this.client.from("mines").select("*");
    if (mineIds !== "ALL") q = q.in("id", mineIds);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapMine);
  }
  async createMine(input: Omit<Mine, "id">): Promise<Mine> {
    const { data, error } = await this.client
      .from("mines")
      .insert({ region_id: input.regionId, name: input.name, code: input.code, mine_type: input.mineType, latitude: input.latitude, longitude: input.longitude, status: input.status })
      .select()
      .single();
    if (error) throw error;
    return mapMine(data);
  }

  async createComplianceRequirement(input: Omit<ComplianceRequirement, "id">): Promise<ComplianceRequirement> {
    const { data, error } = await this.client
      .from("compliance_requirements")
      .insert({ mine_id: input.mineId, category_id: input.categoryId, title: input.title, description: input.description, regulatory_authority: input.regulatoryAuthority, frequency: input.frequency, priority: input.priority, is_demo_content: input.isDemoContent })
      .select().single();
    if (error) throw error;
    return mapComplianceRequirement(data);
  }
  async listComplianceRecords(mineId: string): Promise<ComplianceRecord[]> {
    const { data, error } = await this.client.from("compliance_records").select("*").eq("mine_id", mineId);
    if (error) throw error;
    return (data ?? []).map(mapComplianceRecord);
  }
  async updateComplianceRecord(id: string, patch: Partial<ComplianceRecord>): Promise<ComplianceRecord> {
    const { data, error } = await this.client.from("compliance_records").update(unmapComplianceRecordPatch(patch)).eq("id", id).select().single();
    if (error) throw error;
    return mapComplianceRecord(data);
  }
  async getComplianceRecord(id: string): Promise<ComplianceRecord | null> {
    const { data } = await this.client.from("compliance_records").select("*").eq("id", id).maybeSingle();
    return data ? mapComplianceRecord(data) : null;
  }

  async findInspectionByClientOpId(clientOperationId: string): Promise<Inspection | null> {
    const { data } = await this.client.from("inspections").select("*").eq("client_operation_id", clientOperationId).maybeSingle();
    return data ? mapInspection(data) : null;
  }
  async createInspection(input: Omit<Inspection, "id">): Promise<Inspection> {
    const { data, error } = await this.client
      .from("inspections")
      .insert({ mine_id: input.mineId, inspector_id: input.inspectorId, template_id: input.templateId, inspection_type: input.inspectionType, scheduled_date: input.scheduledDate, latitude: input.latitude, longitude: input.longitude, status: input.status, client_operation_id: input.clientOperationId, client_created_at: input.clientCreatedAt })
      .select().single();
    if (error) throw error;
    return mapInspection(data);
  }
  async getInspection(id: string): Promise<Inspection | null> {
    const { data } = await this.client.from("inspections").select("*").eq("id", id).maybeSingle();
    return data ? mapInspection(data) : null;
  }
  async listInspectionsByMine(mineId: string): Promise<Inspection[]> {
    const { data, error } = await this.client.from("inspections").select("*").eq("mine_id", mineId);
    if (error) throw error;
    return (data ?? []).map(mapInspection);
  }
  async updateInspection(id: string, patch: Partial<Inspection>): Promise<Inspection> {
    const { data, error } = await this.client.from("inspections").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return mapInspection(data);
  }
  async findObservationByClientOpId(clientOperationId: string): Promise<InspectionObservation | null> {
    const { data } = await this.client.from("inspection_observations").select("*").eq("client_operation_id", clientOperationId).maybeSingle();
    return data ? mapObservation(data) : null;
  }
  async createObservation(input: Omit<InspectionObservation, "id">): Promise<InspectionObservation> {
    const { data, error } = await this.client
      .from("inspection_observations")
      .insert({ inspection_id: input.inspectionId, description: input.description, severity: input.severity, latitude: input.latitude, longitude: input.longitude, photo_document_id: input.photoDocumentId, client_operation_id: input.clientOperationId, client_created_at: input.clientCreatedAt })
      .select().single();
    if (error) throw error;
    return mapObservation(data);
  }

  async listObservationsByInspection(inspectionId: string): Promise<InspectionObservation[]> {
    const { data, error } = await this.client.from("inspection_observations").select("*").eq("inspection_id", inspectionId);
    if (error) throw error;
    return (data ?? []).map(mapObservation);
  }

  async createCorrectiveAction(input: Omit<CorrectiveAction, "id">): Promise<CorrectiveAction> {
    const { data, error } = await this.client
      .from("corrective_actions")
      .insert({ source_type: input.sourceType, source_id: input.sourceId, issue: input.issue, responsible_user_id: input.responsibleUserId, deadline: input.deadline, priority: input.priority, status: input.status })
      .select().single();
    if (error) throw error;
    return mapCorrectiveAction(data);
  }
  async listCorrectiveActionsBySource(sourceType: CorrectiveAction["sourceType"] | "ALL", sourceIds: string[] | "ALL"): Promise<CorrectiveAction[]> {
    let query = this.client.from("corrective_actions").select("*");
    if (sourceType !== "ALL") query = query.eq("source_type", sourceType);
    if (sourceIds !== "ALL") query = query.in("source_id", sourceIds);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapCorrectiveAction);
  }
  async getCorrectiveAction(id: string): Promise<CorrectiveAction | null> {
    const { data } = await this.client.from("corrective_actions").select("*").eq("id", id).maybeSingle();
    return data ? mapCorrectiveAction(data) : null;
  }
  async updateCorrectiveAction(id: string, patch: Partial<CorrectiveAction>): Promise<CorrectiveAction> {
    const { data, error } = await this.client.from("corrective_actions").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return mapCorrectiveAction(data);
  }

  async findIncidentByClientOpId(clientOperationId: string): Promise<Incident | null> {
    const { data } = await this.client.from("incidents").select("*").eq("client_operation_id", clientOperationId).maybeSingle();
    return data ? mapIncident(data) : null;
  }
  async createIncident(input: Omit<Incident, "id">): Promise<Incident> {
    const { data, error } = await this.client
      .from("incidents")
      .insert({ mine_id: input.mineId, incident_type_id: input.incidentTypeId, occurred_at: input.occurredAt, latitude: input.latitude, longitude: input.longitude, description: input.description, severity: input.severity, status: input.status, client_operation_id: input.clientOperationId, client_created_at: input.clientCreatedAt })
      .select().single();
    if (error) throw error;
    return mapIncident(data);
  }
  async listIncidentsByMine(mineId: string): Promise<Incident[]> {
    const { data, error } = await this.client.from("incidents").select("*").eq("mine_id", mineId);
    if (error) throw error;
    return (data ?? []).map(mapIncident);
  }

  async createContractor(input: Omit<Contractor, "id">): Promise<Contractor> {
    const { data, error } = await this.client.from("contractors").insert({ mine_id: input.mineId, company_name: input.companyName, status: input.status }).select().single();
    if (error) throw error;
    return mapContractor(data);
  }
  async listContractorsByMine(mineId: string): Promise<Contractor[]> {
    const { data, error } = await this.client.from("contractors").select("*").eq("mine_id", mineId);
    if (error) throw error;
    return (data ?? []).map(mapContractor);
  }
  async getContractor(id: string): Promise<Contractor | null> {
    const { data } = await this.client.from("contractors").select("*").eq("id", id).maybeSingle();
    return data ? mapContractor(data) : null;
  }
  async listContractorWorkers(contractorId: string) {
    const { data, error } = await this.client.from("contractor_workers").select("*").eq("contractor_id", contractorId);
    if (error) throw error;
    return (data ?? []).map((w: any) => ({ id: w.id, contractorId: w.contractor_id, fullName: w.full_name }));
  }

  async createDocument(input: Omit<DocumentRecord, "id">): Promise<DocumentRecord> {
    const { data, error } = await this.client
      .from("documents")
      .insert({ mine_id: input.mineId, owner_type: input.ownerType, owner_id: input.ownerId, storage_path: input.storagePath, file_name: input.fileName, mime_type: input.mimeType, uploaded_by: input.uploadedBy })
      .select().single();
    if (error) throw error;
    return mapDocument(data);
  }
  async listDocuments(ownerType: string, ownerId: string): Promise<DocumentRecord[]> {
    const { data, error } = await this.client.from("documents").select("*").eq("owner_type", ownerType).eq("owner_id", ownerId);
    if (error) throw error;
    return (data ?? []).map(mapDocument);
  }

  async listNotifications(userId: string): Promise<NotificationRecord[]> {
    const { data, error } = await this.client.from("notifications").select("*").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((n: any) => ({ id: n.id, userId: n.user_id, title: n.title, body: n.body, type: n.type, isRead: n.is_read }));
  }
  async markNotificationRead(id: string, userId: string): Promise<void> {
    const { error } = await this.client.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
    if (error) throw error;
  }

  async logAudit(entry: AuditEntry): Promise<void> {
    // Prefer the DB-side SECURITY DEFINER function (fn_log_audit, 0011_rls.sql) so the
    // insert runs with elevated rights and audit_logs' no-app-insert-policy stays intact.
    const { error } = await this.client.rpc("fn_log_audit", {
      p_action: entry.action,
      p_entity_type: entry.entityType,
      p_entity_id: entry.entityId,
      p_previous: entry.previousData ?? null,
      p_new: entry.newData ?? null,
    });
    if (error) throw error;
  }
  async listAuditLogs(): Promise<AuditEntry[]> {
    const { data, error } = await this.client.from("audit_logs").select("*");
    if (error) throw error;
    return (data ?? []).map((a: any) => ({ actorId: a.actor_id, action: a.action, entityType: a.entity_type, entityId: a.entity_id, previousData: a.previous_data, newData: a.new_data }));
  }
}

// --- snake_case (DB) <-> camelCase (DTO) mappers ---
function mapMine(r: any): Mine { return { id: r.id, regionId: r.region_id, name: r.name, code: r.code, mineType: r.mine_type, latitude: r.latitude, longitude: r.longitude, status: r.status }; }
function mapComplianceRequirement(r: any): ComplianceRequirement { return { id: r.id, mineId: r.mine_id, categoryId: r.category_id, title: r.title, description: r.description, regulatoryAuthority: r.regulatory_authority, frequency: r.frequency, priority: r.priority, isDemoContent: r.is_demo_content }; }
function mapComplianceRecord(r: any): ComplianceRecord { return { id: r.id, requirementId: r.requirement_id, mineId: r.mine_id, dueDate: r.due_date, completedDate: r.completed_date, status: r.status, notes: r.notes }; }
function unmapComplianceRecordPatch(p: Partial<ComplianceRecord>) { const out: any = {}; if (p.status) out.status = p.status; if (p.notes !== undefined) out.notes = p.notes; if (p.completedDate !== undefined) out.completed_date = p.completedDate; return out; }
function mapInspection(r: any): Inspection { return { id: r.id, mineId: r.mine_id, inspectorId: r.inspector_id, templateId: r.template_id, inspectionType: r.inspection_type, scheduledDate: r.scheduled_date, actualDate: r.actual_date, latitude: r.latitude, longitude: r.longitude, status: r.status, clientOperationId: r.client_operation_id, clientCreatedAt: r.client_created_at, syncStatus: r.sync_status }; }
function mapObservation(r: any): InspectionObservation { return { id: r.id, inspectionId: r.inspection_id, description: r.description, severity: r.severity, latitude: r.latitude, longitude: r.longitude, photoDocumentId: r.photo_document_id, clientOperationId: r.client_operation_id, clientCreatedAt: r.client_created_at, syncStatus: r.sync_status }; }
function mapCorrectiveAction(r: any): CorrectiveAction { return { id: r.id, sourceType: r.source_type, sourceId: r.source_id, issue: r.issue, responsibleUserId: r.responsible_user_id, deadline: r.deadline, priority: r.priority, status: r.status }; }
function mapIncident(r: any): Incident { return { id: r.id, mineId: r.mine_id, incidentTypeId: r.incident_type_id, occurredAt: r.occurred_at, latitude: r.latitude, longitude: r.longitude, description: r.description, severity: r.severity, status: r.status, clientOperationId: r.client_operation_id, clientCreatedAt: r.client_created_at, syncStatus: r.sync_status }; }
function mapContractor(r: any): Contractor { return { id: r.id, mineId: r.mine_id, companyName: r.company_name, status: r.status }; }
function mapDocument(r: any): DocumentRecord { return { id: r.id, mineId: r.mine_id, ownerType: r.owner_type, ownerId: r.owner_id, storagePath: r.storage_path, fileName: r.file_name, mimeType: r.mime_type, uploadedBy: r.uploaded_by }; }
