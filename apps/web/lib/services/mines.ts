import type { AuthContext, Mine } from "@sih/types";
import type { MineCreateInput } from "@sih/validation";
import type { Db } from "../db/types";
import { assertPermission, assertMineAccess } from "../authz";

export async function listMinesForUser(ctx: AuthContext, db: Db): Promise<Mine[]> {
  const orgWide = ctx.roles.some((r) => r.roleKey === "SUPER_ADMIN" || r.roleKey === "CORPORATE_ADMIN");
  if (orgWide) return db.listMines("ALL");
  const mineIds = ctx.roles.map((r) => r.mineId).filter((id): id is string => id !== null);
  return db.listMines(mineIds);
}

export async function createMine(ctx: AuthContext, db: Db, input: MineCreateInput): Promise<Mine> {
  assertPermission(ctx, "mines.manage");
  const mine = await db.createMine({ regionId: input.regionId, name: input.name, code: input.code, mineType: input.mineType, latitude: input.latitude ?? null, longitude: input.longitude ?? null, status: "ACTIVE" });
  await db.logAudit({ actorId: ctx.userId, action: "mine.created", entityType: "mine", entityId: mine.id, newData: mine });
  return mine;
}

/** Used by every other mine-scoped service to fail fast+consistently. Kept here to avoid drift. */
export function requireMineAccess(ctx: AuthContext, mineId: string) {
  assertMineAccess(ctx, mineId);
}
