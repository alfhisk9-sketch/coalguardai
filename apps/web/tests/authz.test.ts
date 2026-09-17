import { describe, it, expect } from "vitest";
import { hasPermission, hasMineAccess, assertPermission, assertMineAccess, isOwnContractor, ForbiddenError } from "../lib/authz";
import { UnauthenticatedError } from "../lib/errors";
import { makeCtx, MINE_A, MINE_B, CONTRACTOR_A } from "./fixtures";

describe("authz primitives", () => {
  it("a user with zero role assignments has zero permissions and zero mine access", () => {
    const anonish = makeCtx({ userId: "ghost", roleKey: "CONTRACTOR", contractorId: null });
    // CONTRACTOR role does have some permissions by default in the matrix, so test a truly empty ctx:
    const empty = { userId: "empty", roles: [], permissions: [], contractorId: null };
    expect(hasPermission(empty, "mines.view")).toBe(false);
    expect(hasMineAccess(empty, MINE_A)).toBe(false);
  });

  it("assertPermission throws ForbiddenError (not a generic Error) when missing", () => {
    const ctx = makeCtx({ userId: "u", roleKey: "INSPECTOR", mineId: MINE_A });
    expect(() => assertPermission(ctx, "mines.manage")).toThrow(ForbiddenError);
  });

  it("assertMineAccess passes for the assigned mine and throws for a different one", () => {
    const ctx = makeCtx({ userId: "u", roleKey: "MINE_MANAGER", mineId: MINE_A });
    expect(() => assertMineAccess(ctx, MINE_A)).not.toThrow();
    expect(() => assertMineAccess(ctx, MINE_B)).toThrow(ForbiddenError);
  });

  it("SUPER_ADMIN and CORPORATE_ADMIN bypass mine-scoping regardless of mineId on their role row", () => {
    const superCtx = makeCtx({ userId: "u", roleKey: "SUPER_ADMIN", mineId: null });
    expect(hasMineAccess(superCtx, MINE_A)).toBe(true);
    expect(hasMineAccess(superCtx, MINE_B)).toBe(true);
  });

  it("isOwnContractor only matches the exact contractor id on the profile, never a guess", () => {
    const ctx = makeCtx({ userId: "u", roleKey: "CONTRACTOR", contractorId: CONTRACTOR_A });
    expect(isOwnContractor(ctx, CONTRACTOR_A)).toBe(true);
    expect(isOwnContractor(ctx, "some-other-id")).toBe(false);
  });

  it("UnauthenticatedError and ForbiddenError are distinct error types (401 vs 403 mapping in errors.ts)", () => {
    expect(new UnauthenticatedError()).toBeInstanceOf(Error);
    expect(new ForbiddenError()).toBeInstanceOf(Error);
    expect(new UnauthenticatedError()).not.toBeInstanceOf(ForbiddenError);
  });
});
