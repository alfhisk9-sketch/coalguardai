import type { AuthContext, Incident } from "@sih/types";
import type { IncidentCreateInput } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess } from "../authz";

export async function createIncident(ctx: AuthContext, db: Db, input: IncidentCreateInput): Promise<{ incident: Incident; wasExisting: boolean }> {
  assertPermission(ctx, "incidents.create");
  assertMineAccess(ctx, input.mineId);

  if (input.clientOperationId) {
    const existing = await db.findIncidentByClientOpId(input.clientOperationId);
    if (existing) return { incident: existing, wasExisting: true };
  }

  const incident = await db.createIncident({
    mineId: input.mineId, incidentTypeId: input.incidentTypeId ?? null, occurredAt: input.occurredAt,
    latitude: input.latitude ?? null, longitude: input.longitude ?? null, description: input.description,
    severity: input.severity, status: "REPORTED",
    clientOperationId: input.clientOperationId, clientCreatedAt: input.clientCreatedAt, syncStatus: "SYNCED",
  });
  await db.logAudit({ actorId: ctx.userId, action: "incident.created", entityType: "incident", entityId: incident.id, newData: incident });
  return { incident, wasExisting: false };
}

/**
 * Account 2 addition (see docs/C2_HANDOFF.md) — mirrors listInspections in
 * inspections.ts: wraps the existing Db.listIncidentsByMine with assertMineAccess.
 * No schema, DTO, or Zod change.
 */
export async function listIncidents(ctx: AuthContext, db: Db, mineId: string): Promise<Incident[]> {
  assertMineAccess(ctx, mineId);
  return db.listIncidentsByMine(mineId);
}
