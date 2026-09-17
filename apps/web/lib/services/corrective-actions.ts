import type { AuthContext, CorrectiveAction } from "@sih/types";
import type { CorrectiveActionCreateInput } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess, ForbiddenError } from "../authz";
import { NotFoundError } from "../errors";

export async function createCorrectiveAction(ctx: AuthContext, db: Db, input: CorrectiveActionCreateInput): Promise<CorrectiveAction> {
  // Polymorphic source — permission depends on context (compliance.manage OR inspections.approve),
  // matching API.md's "context-dependent" note for this route.
  const allowed = ctx.permissions.includes("compliance.manage") || ctx.permissions.includes("inspections.approve");
  if (!allowed) throw new ForbiddenError();

  const action = await db.createCorrectiveAction({
    sourceType: input.sourceType, sourceId: input.sourceId, issue: input.issue,
    responsibleUserId: input.responsibleUserId ?? null, deadline: input.deadline ?? null,
    priority: input.priority, status: "OPEN",
  });
  await db.logAudit({ actorId: ctx.userId, action: "corrective_action.created", entityType: "corrective_action", entityId: action.id, newData: action });
  return action;
}

/**
 * Account 2 minimal integration addition (see docs/C2_HANDOFF.md).
 *
 * corrective_actions has no mine_id column — its source is polymorphic
 * (INSPECTION | INCIDENT | COMPLIANCE). Rather than add a column (which would mean a
 * migration and a second source of truth for mine scope, against ROLES.md), this
 * resolves the mine's own source rows first and queries actions by those ids. Scope is
 * therefore derived from data the caller already has mine access to.
 */
export async function listCorrectiveActionsForMine(ctx: AuthContext, db: Db, mineId: string): Promise<CorrectiveAction[]> {
  assertMineAccess(ctx, mineId);
  const [inspections, incidents, records] = await Promise.all([
    db.listInspectionsByMine(mineId),
    db.listIncidentsByMine(mineId),
    db.listComplianceRecords(mineId),
  ]);
  const sourceIds = [
    ...inspections.map((i) => i.id),
    ...incidents.map((i) => i.id),
    ...records.map((r) => r.id),
  ];
  if (sourceIds.length === 0) return [];
  return db.listCorrectiveActionsBySource("ALL", sourceIds);
}

export async function verifyCorrectiveAction(ctx: AuthContext, db: Db, actionId: string): Promise<CorrectiveAction> {
  assertPermission(ctx, "inspections.approve"); // verification is a manager-tier action
  const existing = await db.getCorrectiveAction(actionId);
  if (!existing) throw new NotFoundError();
  if (existing.status !== "COMPLETED") {
    throw new ForbiddenError("Only completed corrective actions can be verified.");
  }
  const updated = await db.updateCorrectiveAction(actionId, { status: "VERIFIED" });
  await db.logAudit({ actorId: ctx.userId, action: "corrective_action.verified", entityType: "corrective_action", entityId: actionId, previousData: existing, newData: updated });
  return updated;
}
