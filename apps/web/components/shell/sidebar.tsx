"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_GROUP_ORDER, visibleNavItems } from "../../lib/nav";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { NavIcon } from "./nav-icon";
import { BrandLogo } from "./brand-logo";

const GROUP_I18N_KEYS: Record<string, any> = {
  "Overview": "group_overview",
  "Operations": "group_operations",
  "Workforce": "group_workforce",
  "Environment": "group_environment",
  "Documents": "group_documents",
  "Intelligence": "group_intelligence",
  "Governance": "group_governance",
  "Administration": "group_administration",
  "Field Operations": "group_field_operations",
};

const ITEM_I18N_KEYS: Record<string, any> = {
  "Dashboard": "nav_dashboard",
  "Mines": "nav_mines",
  "Map": "nav_map",
  "Compliance": "nav_compliance",
  "Inspections": "nav_inspections",
  "Incidents": "nav_incidents",
  "Observations": "nav_observations",
  "Corrective Actions": "nav_corrective_actions",
  "Contractors": "nav_contractors",
  "Workers": "nav_workers",
  "Attendance": "nav_attendance",
  "Environmental": "nav_environmental",
  "Production": "nav_production",
  "Documents": "nav_documents",
  "AI Assistant": "nav_assistant",
  "Notifications": "nav_notifications",
  "Grievances": "nav_grievances",
  "Audit Log": "nav_audit",
  "Reports": "nav_reports",
  "Administration": "nav_admin",
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { ctx } = useAuth();
  const { t } = useI18n();
  const items = visibleNavItems(ctx?.permissions ?? []);

  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto scrollbar-thin px-3 py-3" aria-label="Main navigation">
      {NAV_GROUP_ORDER.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        const groupKey = GROUP_I18N_KEYS[group];
        const groupLabel = groupKey ? t(groupKey) : group;
        return (
          <div key={group} className="space-y-1">
            <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {groupLabel}
            </p>
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const itemKey = ITEM_I18N_KEYS[item.label];
                const itemLabel = itemKey ? t(itemKey) : item.label;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <NavIcon
                        name={item.icon}
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                          active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{itemLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block shadow-sm">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <BrandLogo size="md" />
      </div>
      <div className="h-[calc(100vh-3.5rem)]">
        <SidebarContent />
      </div>
    </aside>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <BrandLogo size="md" />
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="h-[calc(100vh-3.5rem)]">
          <SidebarContent onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

export { BrandLogo as BrandMark };
