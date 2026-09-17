import type { AuthContext } from "@sih/types";
import type { RoleKey } from "@sih/config";
import { ROLE_PERMISSION_MATRIX } from "@sih/config";

/**
 * DEMO SESSION SUPPORT — explicitly opt-in via NEXT_PUBLIC_DEMO_MODE=true.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface NamedDemoAccount {
  name: string;
  email: string;
  roleKey: RoleKey;
  roleLabel: string;
  mineId: string | null;
  contractorId: string | null;
}

export const NAMED_DEMO_ACCOUNTS: Record<RoleKey, NamedDemoAccount> = {
  SUPER_ADMIN: {
    name: "Alfhi",
    email: "alfhi.demo@sih26024.test",
    roleKey: "SUPER_ADMIN",
    roleLabel: "Super Admin",
    mineId: null,
    contractorId: null,
  },
  CORPORATE_ADMIN: {
    name: "Rabbani",
    email: "rabbani.demo@sih26024.test",
    roleKey: "CORPORATE_ADMIN",
    roleLabel: "Corporate Admin",
    mineId: null,
    contractorId: null,
  },
  MINE_MANAGER: {
    name: "Akshay",
    email: "akshay.demo@sih26024.test",
    roleKey: "MINE_MANAGER",
    roleLabel: "Mine Manager",
    mineId: "a0000000-0000-0000-0000-000000000030", // Shakti Open Cast Mine
    contractorId: null,
  },
  INSPECTOR: {
    name: "Krishna",
    email: "krishna.demo@sih26024.test",
    roleKey: "INSPECTOR",
    roleLabel: "Inspector",
    mineId: "a0000000-0000-0000-0000-000000000030", // Shakti Open Cast Mine
    contractorId: null,
  },
  CONTRACTOR: {
    name: "Koushik",
    email: "koushik.demo@sih26024.test",
    roleKey: "CONTRACTOR",
    roleLabel: "Contractor",
    mineId: null,
    contractorId: "a0000000-0000-0000-0000-000000000110", // Alpha Mining Services
  },
  REGULATOR: {
    name: "Hema",
    email: "hema.demo@sih26024.test",
    roleKey: "REGULATOR",
    roleLabel: "Regulator",
    mineId: "a0000000-0000-0000-0000-000000000030", // Shakti Open Cast Mine
    contractorId: null,
  },
};

export const DEMO_MINE_IDS = ["a0000000-0000-0000-0000-000000000030", "mine-1", "mine-2", "mine-3", "mine-4"];

export function buildDemoAuthContext(roleKey: RoleKey): AuthContext {
  const persona = NAMED_DEMO_ACCOUNTS[roleKey];
  const orgWide = roleKey === "SUPER_ADMIN" || roleKey === "CORPORATE_ADMIN";
  const assignedMine: string | null = orgWide ? null : (persona?.mineId || DEMO_MINE_IDS[0] || null);

  return {
    userId: persona ? persona.name : `demo-${roleKey.toLowerCase()}`,
    userName: persona ? persona.name : null,
    userEmail: persona ? persona.email : null,
    roles: [{ roleKey, mineId: orgWide ? null : assignedMine }],
    permissions: [...ROLE_PERMISSION_MATRIX[roleKey]],
    contractorId: persona?.contractorId ?? (roleKey === "CONTRACTOR" ? "a0000000-0000-0000-0000-000000000110" : null),
  };
}

export const DEMO_ROLE_STORAGE_KEY = "minegov.demoRole";
