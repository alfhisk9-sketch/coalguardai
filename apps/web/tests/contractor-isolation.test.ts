import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { listWorkersForContractor } from "../lib/services/contractors";
import { ForbiddenError } from "../lib/authz";
import { contractorUserA, contractorUserB, mineManagerA, CONTRACTOR_A, CONTRACTOR_B, MINE_A } from "./fixtures";

describe("contractor isolation contract (SECURITY.md 4c)", () => {
  let db: MemoryDb;
  beforeEach(() => {
    db = new MemoryDb();
    db.contractors.push(
      { id: CONTRACTOR_A, mineId: MINE_A, companyName: "Contractor A Pvt Ltd", status: "ACTIVE" },
      { id: CONTRACTOR_B, mineId: MINE_A, companyName: "Contractor B Pvt Ltd", status: "ACTIVE" }
    );
    db.workers.push(
      { id: "w1", contractorId: CONTRACTOR_A, fullName: "Worker A1" },
      { id: "w2", contractorId: CONTRACTOR_B, fullName: "Worker B1" }
    );
  });

  it("Contractor A can list their own workers", async () => {
    const workers = await listWorkersForContractor(contractorUserA, db, CONTRACTOR_A, MINE_A);
    expect(workers.map((w) => w.id)).toEqual(["w1"]);
  });

  it("Contractor A is FORBIDDEN from listing Contractor B's workers — this is the core isolation guarantee", async () => {
    await expect(listWorkersForContractor(contractorUserA, db, CONTRACTOR_B, MINE_A)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Contractor B symmetrically cannot list Contractor A's workers", async () => {
    await expect(listWorkersForContractor(contractorUserB, db, CONTRACTOR_A, MINE_A)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("Mine staff with contractors.view CAN list any contractor's workers within their mine scope", async () => {
    const workers = await listWorkersForContractor(mineManagerA, db, CONTRACTOR_B, MINE_A);
    expect(workers.map((w) => w.id)).toEqual(["w2"]);
  });
});
