import type { AuthContext, Contractor } from "@sih/types";
import type { ContractorCreateInput } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess, isOwnContractor, ForbiddenError } from "../authz";

export async function createContractor(ctx: AuthContext, db: Db, input: ContractorCreateInput): Promise<Contractor> {
  assertPermission(ctx, "contractors.manage");
  assertMineAccess(ctx, input.mineId);
  const contractor = await db.createContractor({ mineId: input.mineId, companyName: input.companyName, status: "ACTIVE" });
  await db.logAudit({ actorId: ctx.userId, action: "contractor.created", entityType: "contractor", entityId: contractor.id, newData: contractor });
  return contractor;
}

/**
 * Contractor isolation, enforced in application code as the second layer on top of RLS
 * (SECURITY.md 4c): a CONTRACTOR-role caller may only ever list their own contractor's
 * workers, regardless of mine access. A staff caller (contractors.view) can list any
 * contractor within their mine scope.
 */
export async function listWorkersForContractor(ctx: AuthContext, db: Db, contractorId: string, contractorMineId: string) {
  const isStaff = ctx.permissions.includes("contractors.view");
  const isOwn = isOwnContractor(ctx, contractorId);
  if (!isOwn && !(isStaff && hasMineAccessSafe(ctx, contractorMineId))) {
    throw new ForbiddenError("You do not have access to this contractor's workers.");
  }
  return db.listContractorWorkers(contractorId);
}

/**
 * Account 2 minimal integration addition (see docs/C2_HANDOFF.md).
 * Mirrors listWorkersForContractor's isolation rule: a CONTRACTOR-role caller sees only
 * their own contractor record; a staff caller with contractors.view sees contractors at
 * mines in their scope. No schema, DTO, or Zod change.
 */
export async function listContractors(ctx: AuthContext, db: Db, mineId?: string): Promise<Contractor[]> {
  if (mineId && mineId !== "ALL") {
    assertMineAccess(ctx, mineId);
    const all = await db.listContractorsByMine(mineId);
    if (ctx.contractorId !== null && !ctx.permissions.includes("contractors.manage")) {
      return all.filter((c) => c.id === ctx.contractorId);
    }
    assertPermission(ctx, "contractors.view");
    return all;
  }

  // Portfolio-wide list scoped to user's authorized mines
  if (ctx.contractorId !== null && !ctx.permissions.includes("contractors.manage")) {
    const own = await db.getContractor(ctx.contractorId);
    return own ? [own] : [];
  }

  assertPermission(ctx, "contractors.view");
  const isGlobal = ctx.roles.some((r) => r.roleKey === "SUPER_ADMIN" || r.roleKey === "CORPORATE_ADMIN");
  if (isGlobal) {
    const allMines = await db.listMines("ALL");
    const contractors = await Promise.all(allMines.map((m) => db.listContractorsByMine(m.id)));
    return contractors.flat();
  }

  const mineIds = ctx.roles.map((r) => r.mineId).filter(Boolean) as string[];
  const contractors = await Promise.all(mineIds.map((id) => db.listContractorsByMine(id)));
  return contractors.flat();
}

function hasMineAccessSafe(ctx: AuthContext, mineId: string): boolean {
  try {
    assertMineAccess(ctx, mineId);
    return true;
  } catch {
    return false;
  }
}
