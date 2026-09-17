import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { correctiveActionCreateSchema, incidentCreateSchema } from "@sih/validation";
import { createCorrectiveAction, verifyCorrectiveAction } from "../lib/services/corrective-actions";
import { createIncident } from "../lib/services/incidents";
import { ForbiddenError } from "../lib/authz";
import { NotFoundError } from "../lib/errors";
import { mineManagerA, contractorUserA, MINE_A, MINE_B } from "./fixtures";

describe("corrective actions contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("MINE_MANAGER can create a corrective action from any source type", async () => {
    const input = correctiveActionCreateSchema.parse({ sourceType: "INSPECTION", sourceId: "99999999-0000-0000-0000-000000000001", issue: "Missing guard rail near conveyor" });
    const action = await createCorrectiveAction(mineManagerA, db, input);
    expect(action.status).toBe("OPEN");
  });

  it("CONTRACTOR cannot create a corrective action (lacks compliance.manage and inspections.approve)", async () => {
    const input = correctiveActionCreateSchema.parse({ sourceType: "COMPLIANCE", sourceId: "99999999-0000-0000-0000-000000000002", issue: "Overdue evidence upload" });
    await expect(createCorrectiveAction(contractorUserA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("verification requires COMPLETED status first — cannot verify an OPEN action", async () => {
    const action = await createCorrectiveAction(mineManagerA, db, correctiveActionCreateSchema.parse({ sourceType: "INCIDENT", sourceId: "99999999-0000-0000-0000-000000000003", issue: "Repair damaged fencing" }));
    await expect(verifyCorrectiveAction(mineManagerA, db, action.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("verifying a nonexistent action returns NotFoundError", async () => {
    await expect(verifyCorrectiveAction(mineManagerA, db, "missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("full lifecycle: create -> mark completed -> verify", async () => {
    const action = await createCorrectiveAction(mineManagerA, db, correctiveActionCreateSchema.parse({ sourceType: "INCIDENT", sourceId: "99999999-0000-0000-0000-000000000004", issue: "Guard rail replaced" }));
    await db.updateCorrectiveAction(action.id, { status: "COMPLETED" });
    const verified = await verifyCorrectiveAction(mineManagerA, db, action.id);
    expect(verified.status).toBe("VERIFIED");
  });
});

describe("incidents contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("mine-scoped user can report an incident at their own mine", async () => {
    const input = incidentCreateSchema.parse({ mineId: MINE_A, occurredAt: new Date().toISOString(), description: "Minor equipment fault", severity: "LOW" });
    const { incident } = await createIncident(mineManagerA, db, input);
    expect(incident.status).toBe("REPORTED");
  });

  it("cannot report an incident at a mine outside the user's scope", async () => {
    const input = incidentCreateSchema.parse({ mineId: MINE_B, occurredAt: new Date().toISOString(), description: "Vehicle collision near gate", severity: "LOW" });
    await expect(createIncident(mineManagerA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("idempotent offline incident retry does not duplicate", async () => {
    const opId = "cccccccc-0000-0000-0000-000000000001";
    const input = incidentCreateSchema.parse({ mineId: MINE_A, occurredAt: new Date().toISOString(), description: "Fall hazard reported", severity: "MEDIUM", clientOperationId: opId });
    await createIncident(mineManagerA, db, input);
    await createIncident(mineManagerA, db, input);
    expect(db.incidents).toHaveLength(1);
  });
});
