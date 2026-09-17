import type { AuthContext } from "@sih/types";
import type { PermissionKey } from "@sih/config";

export class ForbiddenError extends Error {
  code = "FORBIDDEN" as const;
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
  }
}

/**
 * Mirrors supabase/migrations/0003_rbac.sql fn_user_has_permission / fn_user_has_mine_access.
 * This is the API-layer half of "defense in depth" (SECURITY.md #2) — RLS is the real boundary,
 * this is a fast-fail check that also produces a clean 403 instead of a confusing empty result.
 *
 * IMPORTANT: mine scope comes ONLY from ctx.roles (sourced from user_roles). Never from any
 * cached profile field. This function is the single place that rule is enforced in application code.
 */
export function hasPermission(ctx: AuthContext, permission: PermissionKey): boolean {
  return ctx.permissions.includes(permission);
}

export function hasMineAccess(ctx: AuthContext, mineId: string): boolean {
  return ctx.roles.some(
    (r) => r.roleKey === "SUPER_ADMIN" || r.roleKey === "CORPORATE_ADMIN" || r.mineId === mineId
  );
}

export function canManageMine(ctx: AuthContext, permission: PermissionKey, mineId: string): boolean {
  return hasPermission(ctx, permission) && hasMineAccess(ctx, mineId);
}

/** Contractor isolation: never derived from mine access alone (SECURITY.md 4c). */
export function isOwnContractor(ctx: AuthContext, contractorId: string): boolean {
  return ctx.contractorId !== null && ctx.contractorId === contractorId;
}

export function assertPermission(ctx: AuthContext, permission: PermissionKey): void {
  if (!hasPermission(ctx, permission)) throw new ForbiddenError();
}

export function assertMineAccess(ctx: AuthContext, mineId: string): void {
  if (!hasMineAccess(ctx, mineId)) throw new ForbiddenError("You do not have access to this mine.");
}
