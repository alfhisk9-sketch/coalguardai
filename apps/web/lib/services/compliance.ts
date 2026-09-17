import type { AuthContext, ComplianceRequirement, ComplianceRecord } from "@sih/types";
import type { ComplianceRequirementCreateInput } from "@sih/validation";
import type { z } from "zod";
import type { complianceRecordUpdateSchema } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess } from "../authz";
import { NotFoundError } from "../errors";

type ComplianceRecordUpdateInput = z.infer<typeof complianceRecordUpdateSchema>;

export async function createComplianceRequirement(ctx: AuthContext, db: Db, input: ComplianceRequirementCreateInput): Promise<ComplianceRequirement> {
  assertPermission(ctx, "compliance.manage");
  assertMineAccess(ctx, input.mineId);
  const req = await db.createComplianceRequirement({
    mineId: input.mineId, categoryId: input.categoryId ?? null, title: input.title,
    description: input.description ?? null, regulatoryAuthority: input.regulatoryAuthority ?? null,
    frequency: input.frequency, priority: input.priority, isDemoContent: true,
  });
  await db.logAudit({ actorId: ctx.userId, action: "compliance_requirement.created", entityType: "compliance_requirement", entityId: req.id, newData: req });
  return req;
}

export async function listComplianceRecords(ctx: AuthContext, db: Db, mineId: string): Promise<ComplianceRecord[]> {
  assertMineAccess(ctx, mineId);
  return db.listComplianceRecords(mineId);
}

/** identifyOverdue: pure function over already-fetched records — testable without a DB at all. */
export function identifyOverdue(records: ComplianceRecord[], asOf: Date): ComplianceRecord[] {
  return records.filter((r) => r.status !== "COMPLIANT" && r.status !== "NOT_APPLICABLE" && new Date(r.dueDate) < asOf);
}

export async function updateComplianceRecordStatus(ctx: AuthContext, db: Db, recordId: string, input: ComplianceRecordUpdateInput): Promise<ComplianceRecord> {
  assertPermission(ctx, "compliance.manage");
  const existing = await db.getComplianceRecord(recordId);
  if (!existing) throw new NotFoundError();
  assertMineAccess(ctx, existing.mineId);
  const updated = await db.updateComplianceRecord(recordId, { status: input.status, notes: input.notes, completedDate: input.completedDate });
  await db.logAudit({ actorId: ctx.userId, action: "compliance_record.status_changed", entityType: "compliance_record", entityId: recordId, previousData: existing, newData: updated });
  return updated;
}
