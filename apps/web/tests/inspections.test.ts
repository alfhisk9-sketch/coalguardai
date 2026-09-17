import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { inspectionCreateSchema, observationCreateSchema } from "@sih/validation";
import { createInspection, addObservation, approveInspection } from "../lib/services/inspections";
import { ForbiddenError } from "../lib/authz";
import { NotFoundError } from "../lib/errors";
import { mineManagerA, inspectorA, MINE_A, MINE_B } from "./fixtures";

describe("inspections contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("INSPECTOR can create an inspection at their mine", async () => {
    const input = inspectionCreateSchema.parse({ mineId: MINE_A, inspectionType: "ROUTINE" });
    const { inspection, wasExisting } = await createInspection(inspectorA, db, input);
    expect(wasExisting).toBe(false);
    expect(inspection.inspectorId).toBe(inspectorA.userId);
    expect(inspection.status).toBe("SCHEDULED");
  });

  it("INSPECTOR cannot create an inspection at a mine they aren't assigned to", async () => {
    const input = inspectionCreateSchema.parse({ mineId: MINE_B, inspectionType: "ROUTINE" });
    await expect(createInspection(inspectorA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("offline retry with the same clientOperationId is idempotent — no duplicate row", async () => {
    const opId = "aaaaaaaa-0000-0000-0000-000000000001";
    const input = inspectionCreateSchema.parse({ mineId: MINE_A, inspectionType: "ROUTINE", clientOperationId: opId });
    const first = await createInspection(inspectorA, db, input);
    const second = await createInspection(inspectorA, db, input);
    expect(first.wasExisting).toBe(false);
    expect(second.wasExisting).toBe(true);
    expect(second.inspection.id).toBe(first.inspection.id);
    expect(db.inspections).toHaveLength(1); // the actual duplicate-prevention assertion
  });

  it("adding an observation to a non-existent inspection returns NotFoundError", async () => {
    const input = observationCreateSchema.parse({ inspectionId: "99999999-0000-0000-0000-000000000099", description: "Loose railing near pit edge", severity: "HIGH" });
    await expect(addObservation(inspectorA, db, input)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("observation offline retry is also idempotent", async () => {
    const { inspection } = await createInspection(inspectorA, db, inspectionCreateSchema.parse({ mineId: MINE_A, inspectionType: "ROUTINE" }));
    const opId = "bbbbbbbb-0000-0000-0000-000000000001";
    const input = observationCreateSchema.parse({ inspectionId: inspection.id, description: "Loose railing near pit edge", severity: "HIGH", clientOperationId: opId });
    await addObservation(inspectorA, db, input);
    await addObservation(inspectorA, db, input);
    expect(db.observations).toHaveLength(1);
  });

  it("only inspections.approve holders can approve; INSPECTOR cannot approve their own submission", async () => {
    const { inspection } = await createInspection(inspectorA, db, inspectionCreateSchema.parse({ mineId: MINE_A, inspectionType: "ROUTINE" }));
    await db.updateInspection(inspection.id, { status: "SUBMITTED" });
    await expect(approveInspection(inspectorA, db, inspection.id)).rejects.toBeInstanceOf(ForbiddenError);
    const approved = await approveInspection(mineManagerA, db, inspection.id);
    expect(approved.status).toBe("APPROVED");
  });

  it("cannot approve an inspection still in SCHEDULED state", async () => {
    const { inspection } = await createInspection(inspectorA, db, inspectionCreateSchema.parse({ mineId: MINE_A, inspectionType: "ROUTINE" }));
    await expect(approveInspection(mineManagerA, db, inspection.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
