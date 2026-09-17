import type { AuthContext, Inspection, InspectionObservation } from "@sih/types";
import type { InspectionCreateInput, ObservationCreateInput } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess, ForbiddenError } from "../authz";
import { NotFoundError } from "../errors";

/**
 * Idempotent create: if clientOperationId already exists, return the existing row
 * (200-semantics at the route layer) instead of inserting a duplicate.
 * See DATABASE.md 7b / API.md idempotency section — this is the API-layer half;
 * the DB-layer half is the partial unique index (0005_inspections.sql).
 */
export async function createInspection(ctx: AuthContext, db: Db, input: InspectionCreateInput): Promise<{ inspection: Inspection; wasExisting: boolean }> {
  assertPermission(ctx, "inspections.create");
  assertMineAccess(ctx, input.mineId);

  if (input.clientOperationId) {
    const existing = await db.findInspectionByClientOpId(input.clientOperationId);
    if (existing) return { inspection: existing, wasExisting: true };
  }

  const inspection = await db.createInspection({
    mineId: input.mineId, inspectorId: ctx.userId, templateId: input.templateId ?? null,
    inspectionType: input.inspectionType, scheduledDate: input.scheduledDate ?? null, actualDate: null,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null, status: "SCHEDULED",
    clientOperationId: input.clientOperationId, clientCreatedAt: input.clientCreatedAt, syncStatus: "SYNCED",
  });
  await db.logAudit({ actorId: ctx.userId, action: "inspection.created", entityType: "inspection", entityId: inspection.id, newData: inspection });
  return { inspection, wasExisting: false };
}

export async function addObservation(ctx: AuthContext, db: Db, input: ObservationCreateInput): Promise<{ observation: InspectionObservation; wasExisting: boolean }> {
  assertPermission(ctx, "inspections.create");

  const inspection = await db.getInspection(input.inspectionId);
  if (!inspection) throw new NotFoundError();
  assertMineAccess(ctx, inspection.mineId);

  if (input.clientOperationId) {
    const existing = await db.findObservationByClientOpId(input.clientOperationId);
    if (existing) return { observation: existing, wasExisting: true };
  }

  const observation = await db.createObservation({
    inspectionId: input.inspectionId, description: input.description, severity: input.severity,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null, photoDocumentId: input.photoDocumentId ?? null,
    clientOperationId: input.clientOperationId, clientCreatedAt: input.clientCreatedAt, syncStatus: "SYNCED",
  });
  await db.logAudit({ actorId: ctx.userId, action: "observation.created", entityType: "inspection_observation", entityId: observation.id, newData: observation });
  return { observation, wasExisting: false };
}

/**
 * Account 2 addition (see docs/C2_HANDOFF.md "Backend changes made by Account 2"):
 * the route layer had no GET for inspections even though Db.listInspectionsByMine
 * already existed. This wraps it with the same assertMineAccess pattern used by
 * listComplianceRecords above — no schema, DTO, or Zod change.
 */
export async function listInspections(ctx: AuthContext, db: Db, mineId: string): Promise<Inspection[]> {
  assertMineAccess(ctx, mineId);
  return db.listInspectionsByMine(mineId);
}

/**
 * Account 2 minimal integration addition (see docs/C2_HANDOFF.md).
 * Read side of observations, which C1 shipped write-only. Authorization follows the
 * exact pattern used by addObservation above: resolve the parent inspection, then
 * assert mine access. No schema, DTO, or Zod change.
 */
export async function listObservations(ctx: AuthContext, db: Db, inspectionId: string): Promise<InspectionObservation[]> {
  const inspection = await db.getInspection(inspectionId);
  if (!inspection) throw new NotFoundError();
  assertMineAccess(ctx, inspection.mineId);
  return db.listObservationsByInspection(inspectionId);
}

export async function approveInspection(ctx: AuthContext, db: Db, inspectionId: string): Promise<Inspection> {
  assertPermission(ctx, "inspections.approve");
  const inspection = await db.getInspection(inspectionId);
  if (!inspection) throw new NotFoundError();
  assertMineAccess(ctx, inspection.mineId);
  if (inspection.status !== "SUBMITTED" && inspection.status !== "REVIEWED") {
    throw new ForbiddenError("Only submitted/reviewed inspections can be approved.");
  }
  const updated = await db.updateInspection(inspectionId, { status: "APPROVED" });
  await db.logAudit({ actorId: ctx.userId, action: "inspection.approved", entityType: "inspection", entityId: inspectionId, previousData: inspection, newData: updated });
  return updated;
}
