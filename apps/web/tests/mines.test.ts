import { describe, it, expect, beforeEach } from "vitest";
import { MemoryDb } from "../lib/db/memory";
import { mineCreateSchema } from "@sih/validation";
import { createMine, listMinesForUser } from "../lib/services/mines";
import { ForbiddenError } from "../lib/authz";
import { superAdmin, mineManagerA, inspectorA, MINE_A, MINE_B } from "./fixtures";

describe("mines contract", () => {
  let db: MemoryDb;
  beforeEach(() => { db = new MemoryDb(); });

  it("Zod rejects an invalid mine payload (bad mineType)", () => {
    expect(() => mineCreateSchema.parse({ regionId: "not-a-uuid", name: "X", code: "X", mineType: "FLYING" })).toThrow();
  });

  it("SUPER_ADMIN can create a mine; response matches expected shape", async () => {
    const input = mineCreateSchema.parse({ regionId: "55555555-5555-5555-5555-555555555555", name: "Shakti Open Cast Mine", code: "SHK", mineType: "OPEN_CAST" });
    const mine = await createMine(superAdmin, db, input);
    expect(mine.id).toBeTruthy();
    expect(mine.status).toBe("ACTIVE");
    expect(db.auditLogs).toHaveLength(1); // audit event written (Rule: every mutation is auditable)
  });

  it("INSPECTOR (no mines.manage permission) is rejected with ForbiddenError, not a silent failure", async () => {
    const input = mineCreateSchema.parse({ regionId: "55555555-5555-5555-5555-555555555555", name: "Aditya Open Cast Mine", code: "ADT", mineType: "OPEN_CAST" });
    await expect(createMine(inspectorA, db, input)).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.mines).toHaveLength(0); // nothing was inserted despite the attempt
  });

  it("mine-scoped user (MINE_MANAGER at Mine A) sees only Mine A, never Mine B", async () => {
    db.mines.push(
      { id: MINE_A, regionId: "r", name: "Shakti", code: "SHK", mineType: "OPEN_CAST", latitude: null, longitude: null, status: "ACTIVE" },
      { id: MINE_B, regionId: "r", name: "Surya", code: "SUR", mineType: "OPEN_CAST", latitude: null, longitude: null, status: "ACTIVE" }
    );
    const visible = await listMinesForUser(mineManagerA, db);
    const ids = visible.map((m) => m.id);
    expect(ids).toContain(MINE_A);
    expect(ids).not.toContain(MINE_B);
  });

  it("SUPER_ADMIN (org-wide) sees all mines regardless of user_roles rows", async () => {
    await db.createMine({ regionId: "r", name: "A", code: "A", mineType: "OPEN_CAST", latitude: null, longitude: null, status: "ACTIVE" });
    await db.createMine({ regionId: "r", name: "B", code: "B", mineType: "OPEN_CAST", latitude: null, longitude: null, status: "ACTIVE" });
    const visible = await listMinesForUser(superAdmin, db);
    expect(visible).toHaveLength(2);
  });
});
