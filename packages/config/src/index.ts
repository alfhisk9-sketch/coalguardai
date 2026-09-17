// Mirrors DATABASE.md enums/keys exactly. Update here + in migrations together — never drift.

export const ROLE_KEYS = [
  "SUPER_ADMIN",
  "CORPORATE_ADMIN",
  "MINE_MANAGER",
  "INSPECTOR",
  "CONTRACTOR",
  "REGULATOR",
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const PERMISSION_KEYS = [
  "dashboard.view",
  "mines.view",
  "mines.manage",
  "compliance.view",
  "compliance.manage",
  "inspections.view",
  "inspections.create",
  "inspections.approve",
  "incidents.view",
  "incidents.create",
  "contractors.view",
  "contractors.manage",
  "reports.view",
  "reports.generate",
  "documents.upload",
  "users.manage",
  "audit.view",
  "ai.view",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

// Default role -> permission grants, matching ROLES.md permission matrix exactly.
// This is the seed source; migrations/seed SQL is generated from this table (see supabase/seed).
export const ROLE_PERMISSION_MATRIX: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: [...PERMISSION_KEYS],
  CORPORATE_ADMIN: [
    "dashboard.view", "mines.view", "mines.manage", "compliance.view", "compliance.manage",
    "inspections.view", "inspections.approve", "incidents.view", "incidents.create",
    "contractors.view", "contractors.manage", "reports.view", "reports.generate",
    "documents.upload", "users.manage", "audit.view", "ai.view",
  ],
  MINE_MANAGER: [
    "dashboard.view", "mines.view", "mines.manage", "compliance.view", "compliance.manage",
    "inspections.view", "inspections.approve", "incidents.view", "incidents.create",
    "contractors.view", "contractors.manage", "reports.view", "reports.generate",
    "documents.upload", "audit.view", "ai.view",
  ],
  INSPECTOR: [
    "dashboard.view", "mines.view", "compliance.view", "inspections.view", "inspections.create",
    "incidents.view", "incidents.create", "reports.view", "documents.upload", "ai.view",
  ],
  CONTRACTOR: ["dashboard.view", "mines.view", "compliance.view", "incidents.create", "contractors.view", "reports.view", "documents.upload"],
  REGULATOR: ["dashboard.view", "mines.view", "compliance.view", "inspections.view", "incidents.view", "contractors.view", "reports.view", "ai.view"],
};

export const SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const COMPLIANCE_STATUSES = ["COMPLIANT", "DUE_SOON", "OVERDUE", "NON_COMPLIANT", "UNDER_REVIEW", "NOT_APPLICABLE"] as const;
export const ACTION_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "VERIFIED", "OVERDUE"] as const;

// Entities that support offline mobile creation + idempotent sync (DATABASE.md 7b).
export const OFFLINE_SYNCABLE_ENTITIES = [
  "inspections",
  "inspection_observations",
  "incidents",
  "safety_observations",
  "worker_attendance",
] as const;

export * from "./i18n";

