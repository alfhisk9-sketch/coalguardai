import type { PermissionKey } from "@sih/config";
import {
  LayoutDashboard, Mountain, ShieldCheck, ClipboardList, ListChecks, Flame,
  HardHat, Users2, CalendarCheck, Wind, Factory, FileText, Map as MapIcon,
  Bell, MessageSquareWarning, BarChart3, History, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
  /** Real, working page in this build. If false, the item renders with a "Soon" badge
   * and is not linked — per project rule: no empty pages just to satisfy the module list. */
  implemented: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view", implemented: true },
  { label: "Mines", href: "/mines", icon: Mountain, permission: "mines.view", implemented: true },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck, permission: "compliance.view", implemented: true },
  { label: "Inspections", href: "/inspections", icon: ClipboardList, permission: "inspections.view", implemented: true },
  { label: "Corrective Actions", href: "/corrective-actions", icon: ListChecks, permission: "compliance.view", implemented: true },
  { label: "Incidents", href: "/incidents", icon: Flame, permission: "incidents.view", implemented: true },
  { label: "Contractors", href: "/contractors", icon: HardHat, permission: "contractors.view", implemented: true },
  { label: "Workers", href: "/workers", icon: Users2, permission: "contractors.view", implemented: false },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "contractors.view", implemented: false },
  { label: "Environmental", href: "/environmental", icon: Wind, permission: "mines.view", implemented: false },
  { label: "Production", href: "/production", icon: Factory, permission: "reports.view", implemented: false },
  { label: "Documents", href: "/documents", icon: FileText, permission: "documents.upload", implemented: false },
  { label: "GIS Map", href: "/gis", icon: MapIcon, permission: "mines.view", implemented: false },
  { label: "Notifications", href: "/notifications", icon: Bell, implemented: true },
  { label: "Grievances", href: "/grievances", icon: MessageSquareWarning, implemented: false },
  { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports.view", implemented: false },
  { label: "Audit Log", href: "/audit", icon: History, permission: "audit.view", implemented: true },
  { label: "Admin", href: "/admin", icon: Settings, permission: "users.manage", implemented: false },
];
