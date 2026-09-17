import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { complianceRequirementCreateSchema, complianceRecordUpdateSchema } from "@sih/validation";
import { createComplianceRequirement, updateComplianceRecordStatus, identifyOverdue } from "../lib/services/compliance";
import { ForbiddenError } from "../lib/authz";
import { NotFoundError } from "../lib/errors";
import { mineManagerA, inspectorA, MINE_A, MINE_B } from "./fixtures";

describe("compliance contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("MINE_MANAGER can create a requirement for their own mine", async () => {
    const input = complianceRequirementCreateSchema.parse({ mineId: MINE_A, title: "Weekly safety audit", frequency: "WEEKLY" });
    const req = await createComplianceRequirement(mineManagerA, db, input);
    expect(req.mineId).toBe(MINE_A);
    expect(req.isDemoContent).toBe(true);
  });

  it("MINE_MANAGER cannot create a requirement for a mine they don't manage", async () => {
    const input = complianceRequirementCreateSchema.parse({ mineId: MINE_B, title: "Quarterly water quality check", frequency: "WEEKLY" });
    await expect(createComplianceRequirement(mineManagerA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("INSPECTOR (view-only permission) cannot manage compliance", async () => {
    const input = complianceRequirementCreateSchema.parse({ mineId: MINE_A, title: "Daily dust monitoring log", frequency: "WEEKLY" });
    await expect(createComplianceRequirement(inspectorA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("updating a record that doesn't exist returns NotFoundError, not a silent no-op", async () => {
    const patch = complianceRecordUpdateSchema.parse({ status: "COMPLIANT" });
    await expect(updateComplianceRecordStatus(mineManagerA, db, "does-not-exist", patch)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("status update writes an audit log with previous + new data", async () => {
    db.complianceRecords.push({ id: "rec-1", requirementId: "req-1", mineId: MINE_A, dueDate: "2026-01-01", completedDate: null, status: "UNDER_REVIEW", notes: null });
    const patch = complianceRecordUpdateSchema.parse({ status: "COMPLIANT", notes: "Verified on site" });
    const updated = await updateComplianceRecordStatus(mineManagerA, db, "rec-1", patch);
    expect(updated.status).toBe("COMPLIANT");
    expect(db.auditLogs.at(-1)?.previousData).toMatchObject({ status: "UNDER_REVIEW" });
    expect(db.auditLogs.at(-1)?.newData).toMatchObject({ status: "COMPLIANT" });
  });

  it("identifyOverdue: a non-compliant record past due date is flagged; a future-dated one is not", () => {
    const asOf = new Date("2026-06-01");
    const records = [
      { id: "1", requirementId: "r", mineId: MINE_A, dueDate: "2026-01-01", completedDate: null, status: "UNDER_REVIEW" as const, notes: null },
      { id: "2", requirementId: "r", mineId: MINE_A, dueDate: "2026-12-01", completedDate: null, status: "UNDER_REVIEW" as const, notes: null },
      { id: "3", requirementId: "r", mineId: MINE_A, dueDate: "2026-01-01", completedDate: null, status: "COMPLIANT" as const, notes: null },
    ];
    const overdue = identifyOverdue(records, asOf);
    expect(overdue.map((r) => r.id)).toEqual(["1"]);
  });
});
