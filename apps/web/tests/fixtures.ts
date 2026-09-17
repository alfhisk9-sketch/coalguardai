import type { AuthContext } from "@sih/types";
import { ROLE_PERMISSION_MATRIX } from "@sih/config";

export const MINE_A = "11111111-1111-1111-1111-111111111111";
export const MINE_B = "22222222-2222-2222-2222-222222222222";
export const CONTRACTOR_A = "33333333-3333-3333-3333-333333333333";
export const CONTRACTOR_B = "44444444-4444-4444-4444-444444444444";

export function makeCtx(opts: {
  userId: string;
  roleKey: keyof typeof ROLE_PERMISSION_MATRIX;
  mineId?: string | null;
  contractorId?: string | null;
}): AuthContext {
  return {
    userId: opts.userId,
    roles: [{ roleKey: opts.roleKey, mineId: opts.mineId ?? null }],
    permissions: ROLE_PERMISSION_MATRIX[opts.roleKey],
    contractorId: opts.contractorId ?? null,
  };
}

export const superAdmin = makeCtx({ userId: "u-super", roleKey: "SUPER_ADMIN" });
export const mineManagerA = makeCtx({ userId: "u-mgr-a", roleKey: "MINE_MANAGER", mineId: MINE_A });
export const inspectorA = makeCtx({ userId: "u-insp-a", roleKey: "INSPECTOR", mineId: MINE_A });
export const contractorUserA = makeCtx({ userId: "u-con-a", roleKey: "CONTRACTOR", contractorId: CONTRACTOR_A });
export const contractorUserB = makeCtx({ userId: "u-con-b", roleKey: "CONTRACTOR", contractorId: CONTRACTOR_B });
export const regulator = makeCtx({ userId: "u-reg", roleKey: "REGULATOR", mineId: MINE_A });
