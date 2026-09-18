import type { PermissionKey } from "@sih/config";

export type NavGroup =
  | "Overview"
  | "Operations"
  | "Workforce"
  | "Environment"
  | "Documents"
  | "Intelligence"
  | "Governance"
  | "Administration";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** UX-only gate. Security is enforced by RLS + API middleware, never by this list. */
  permission: PermissionKey;
  group: NavGroup;
}

/**
 * Navigation is filtered by the resolved permissions from AuthContext (GET /api/me).
 * ROLES.md is the source of truth for which role holds which permission — this file
 * only maps permissions to routes, it never hardcodes role names.
 */
export const NAV_ITEMS: NavItem[] = [
  // Overview
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", permission: "dashboard.view", group: "Overview" },
  { label: "Mines", href: "/mines", icon: "Mountain", permission: "mines.view", group: "Overview" },
  { label: "Map", href: "/map", icon: "Map", permission: "mines.view", group: "Overview" },

  // Operations
  { label: "Compliance", href: "/compliance", icon: "ClipboardCheck", permission: "compliance.view", group: "Operations" },
  { label: "Inspections", href: "/inspections", icon: "ClipboardList", permission: "inspections.view", group: "Operations" },
  { label: "Incidents", href: "/incidents", icon: "TriangleAlert", permission: "incidents.view", group: "Operations" },
  { label: "Observations", href: "/observations", icon: "Eye", permission: "inspections.view", group: "Operations" },
  { label: "Corrective Actions", href: "/corrective-actions", icon: "ListChecks", permission: "compliance.view", group: "Operations" },

  // Workforce
  { label: "Contractors", href: "/contractors", icon: "Building2", permission: "contractors.view", group: "Workforce" },
  { label: "Workers", href: "/workers", icon: "Users", permission: "contractors.view", group: "Workforce" },
  { label: "Attendance", href: "/attendance", icon: "CalendarCheck", permission: "contractors.view", group: "Workforce" },

  // Environment
  { label: "Environmental", href: "/environmental", icon: "Leaf", permission: "mines.view", group: "Environment" },
  { label: "Production", href: "/production", icon: "TrendingUp", permission: "reports.view", group: "Environment" },

  // Documents
  { label: "Documents", href: "/documents", icon: "FileText", permission: "documents.upload", group: "Documents" },

  // Intelligence
  { label: "AI Assistant", href: "/assistant", icon: "Bot", permission: "ai.view", group: "Intelligence" },

  // Governance
  { label: "Notifications", href: "/notifications", icon: "Bell", permission: "dashboard.view", group: "Governance" },
  { label: "Grievances", href: "/grievances", icon: "MessageSquareWarning", permission: "dashboard.view", group: "Governance" },
  { label: "Audit Log", href: "/audit", icon: "ScrollText", permission: "audit.view", group: "Governance" },
  { label: "Reports", href: "/reports", icon: "BarChart3", permission: "reports.view", group: "Governance" },

  // Administration
  { label: "Administration", href: "/admin", icon: "Settings", permission: "users.manage", group: "Administration" },
];

export const NAV_GROUP_ORDER: NavGroup[] = [
  "Overview",
  "Operations",
  "Workforce",
  "Environment",
  "Documents",
  "Intelligence",
  "Governance",
  "Administration",
];

export function visibleNavItems(permissions: PermissionKey[]): NavItem[] {
  return NAV_ITEMS.filter((item) => permissions.includes(item.permission));
}
