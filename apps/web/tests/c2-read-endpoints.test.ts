import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { createInspection, addObservation, listObservations } from "../lib/services/inspections";
import { listContractors } from "../lib/services/contractors";
import { createCorrectiveAction, listCorrectiveActionsForMine } from "../lib/services/corrective-actions";
import { ForbiddenError } from "../lib/authz";
import { NotFoundError } from "../lib/errors";
import { MINE_A, MINE_B, CONTRACTOR_A, CONTRACTOR_B, superAdmin, mineManagerA, inspectorA, contractorUserA, makeCtx } from "./fixtures";

/**
 * Contract tests for the read-side routes added by Account 2 (see docs/C2_HANDOFF.md).
 * These mirror the structure of the existing C1 tests: a positive path plus a negative
 * authorization path for each new service function.
 */
describe("listObservations (Account 2 addition)", () => {
  let db: MemoryDb;
  let inspectionId: string;

  beforeEach(async () => {
    db = new MemoryDb();
    const { inspection } = await createInspection(inspectorA, db, {
      mineId: MINE_A,
      inspectionType: "Routine safety inspection",
    } as never);
    inspectionId = inspection.id;
    await addObservation(inspectorA, db, {
      inspectionId,
      description: "Guard rail missing near conveyor",
      severity: "HIGH",
    } as never);
    await addObservation(inspectorA, db, {
      inspectionId,
      description: "Dust suppression underperforming",
      severity: "MEDIUM",
    } as never);
  });

  it("returns every observation saved against the inspection", async () => {
    const observations = await listObservations(inspectorA, db, inspectionId);
    expect(observations).toHaveLength(2);
    expect(observations.map((o) => o.severity).sort()).toEqual(["HIGH", "MEDIUM"]);
  });

  it("does not leak observations from another mine's inspection", async () => {
    const inspectorB = makeCtx({ userId: "u-insp-b", roleKey: "INSPECTOR", mineId: MINE_B });
    await expect(listObservations(inspectorB, db, inspectionId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFound for an unknown inspection instead of returning an empty list", async () => {
    await expect(listObservations(superAdmin, db, "no-such-inspection")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns an empty array for an inspection with no observations", async () => {
    const { inspection } = await createInspection(inspectorA, db, {
      mineId: MINE_A,
      inspectionType: "Ventilation inspection",
    } as never);
    await expect(listObservations(inspectorA, db, inspection.id)).resolves.toEqual([]);
  });
});

describe("listContractors (Account 2 addition)", () => {
  let db: MemoryDb;

  beforeEach(async () => {
    db = new MemoryDb();
    db.contractors.push(
      { id: CONTRACTOR_A, mineId: MINE_A, companyName: "Contractor A", status: "ACTIVE" },
      { id: CONTRACTOR_B, mineId: MINE_A, companyName: "Contractor B", status: "SUSPENDED" }
    );
  });

  it("returns all contractors at the mine for a staff caller", async () => {
    const contractors = await listContractors(mineManagerA, db, MINE_A);
    expect(contractors).toHaveLength(2);
  });

  it("returns only their own record for a contractor-role caller", async () => {
    const ctx = { ...contractorUserA, roles: [{ roleKey: "CONTRACTOR" as const, mineId: MINE_A }] };
    const contractors = await listContractors(ctx, db, MINE_A);
    expect(contractors).toHaveLength(1);
    expect(contractors[0]?.id).toBe(CONTRACTOR_A);
  });

  it("rejects a caller with no access to the mine", async () => {
    const managerB = makeCtx({ userId: "u-mgr-b", roleKey: "MINE_MANAGER", mineId: MINE_B });
    await expect(listContractors(managerB, db, MINE_A)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("listCorrectiveActionsForMine (Account 2 addition)", () => {
  let db: MemoryDb;

  beforeEach(async () => {
    db = new MemoryDb();
  });

  it("returns actions whose source belongs to the mine, and excludes others", async () => {
    const { inspection } = await createInspection(inspectorA, db, {
      mineId: MINE_A,
      inspectionType: "Routine safety inspection",
    } as never);
    await createCorrectiveAction(mineManagerA, db, {
      sourceType: "INSPECTION",
      sourceId: inspection.id,
      issue: "Install guard rail",
      priority: "HIGH",
    } as never);
    // An action whose source is not part of MINE_A must not appear.
    await createCorrectiveAction(superAdmin, db, {
      sourceType: "INSPECTION",
      sourceId: "unrelated-source-id",
      issue: "Unrelated action",
      priority: "LOW",
    } as never);

    const actions = await listCorrectiveActionsForMine(mineManagerA, db, MINE_A);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.issue).toBe("Install guard rail");
  });

  it("returns an empty array when the mine has no source records", async () => {
    await expect(listCorrectiveActionsForMine(mineManagerA, db, MINE_A)).resolves.toEqual([]);
  });

  it("rejects a caller with no access to the mine", async () => {
    const managerB = makeCtx({ userId: "u-mgr-b", roleKey: "MINE_MANAGER", mineId: MINE_B });
    await expect(listCorrectiveActionsForMine(managerB, db, MINE_A)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
