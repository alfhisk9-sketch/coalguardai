import type { PermissionKey } from "@sih/config";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** UX-only gate. Security is enforced by RLS + API middleware, never by this list. */
  permission: PermissionKey;
  group: "Overview" | "Governance" | "Field Operations" | "Workforce" | "Operations" | "Administration";
}

/**
 * Navigation is filtered by the resolved permissions from AuthContext (GET /api/me).
 * ROLES.md is the source of truth for which role holds which permission — this file
 * only maps permissions to routes, it never hardcodes role names.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", permission: "dashboard.view", group: "Overview" },
  { label: "Mines", href: "/mines", icon: "Mountain", permission: "mines.view", group: "Overview" },
  { label: "Map", href: "/map", icon: "Map", permission: "mines.view", group: "Overview" },

  { label: "Compliance", href: "/compliance", icon: "ClipboardCheck", permission: "compliance.view", group: "Governance" },
  { label: "Corrective Actions", href: "/corrective-actions", icon: "ListChecks", permission: "compliance.view", group: "Governance" },
  { label: "Documents", href: "/documents", icon: "FileText", permission: "documents.upload", group: "Governance" },
  { label: "AI Assistant", href: "/assistant", icon: "Bot", permission: "ai.view", group: "Governance" },

  { label: "Inspections", href: "/inspections", icon: "ClipboardList", permission: "inspections.view", group: "Field Operations" },
  { label: "Observations", href: "/observations", icon: "Eye", permission: "inspections.view", group: "Field Operations" },
  { label: "Incidents", href: "/incidents", icon: "TriangleAlert", permission: "incidents.view", group: "Field Operations" },

  { label: "Contractors", href: "/contractors", icon: "Building2", permission: "contractors.view", group: "Workforce" },
  { label: "Workers", href: "/workers", icon: "Users", permission: "contractors.view", group: "Workforce" },
  { label: "Attendance", href: "/attendance", icon: "CalendarCheck", permission: "contractors.view", group: "Workforce" },

  { label: "Environmental", href: "/environmental", icon: "Leaf", permission: "mines.view", group: "Operations" },
  { label: "Production", href: "/production", icon: "TrendingUp", permission: "reports.view", group: "Operations" },
  { label: "Reports", href: "/reports", icon: "BarChart3", permission: "reports.view", group: "Operations" },
  { label: "Grievances", href: "/grievances", icon: "MessageSquareWarning", permission: "dashboard.view", group: "Operations" },

  { label: "Audit Log", href: "/audit", icon: "ScrollText", permission: "audit.view", group: "Administration" },
  { label: "Administration", href: "/admin", icon: "Settings", permission: "users.manage", group: "Administration" },
];

export const NAV_GROUP_ORDER: NavItem["group"][] = [
  "Overview",
  "Governance",
  "Field Operations",
  "Workforce",
  "Operations",
  "Administration",
];

export function visibleNavItems(permissions: PermissionKey[]): NavItem[] {
  return NAV_ITEMS.filter((item) => permissions.includes(item.permission));
}
