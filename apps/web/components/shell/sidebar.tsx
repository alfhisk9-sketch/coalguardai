"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_GROUP_ORDER, visibleNavItems } from "../../lib/nav";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { NavIcon } from "./nav-icon";

const GROUP_I18N_KEYS: Record<string, any> = {
  "Overview": "group_overview",
  "Governance": "group_governance",
  "Field Operations": "group_field_operations",
  "Workforce": "group_workforce",
  "Operations": "group_operations",
  "Administration": "group_administration",
};

const ITEM_I18N_KEYS: Record<string, any> = {
  "Dashboard": "nav_dashboard",
  "Mines": "nav_mines",
  "Map": "nav_map",
  "Compliance": "nav_compliance",
  "Corrective Actions": "nav_corrective_actions",
  "Documents": "nav_documents",
  "AI Assistant": "nav_assistant",
  "Inspections": "nav_inspections",
  "Observations": "nav_observations",
  "Incidents": "nav_incidents",
  "Contractors": "nav_contractors",
  "Workers": "nav_workers",
  "Attendance": "nav_attendance",
  "Environmental": "nav_environmental",
  "Production": "nav_production",
  "Reports": "nav_reports",
  "Grievances": "nav_grievances",
  "Audit Log": "nav_audit",
  "Administration": "nav_admin",
};

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { ctx } = useAuth();
  const { t } = useI18n();
  const items = visibleNavItems(ctx?.permissions ?? []);

  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto scrollbar-thin px-3 py-4" aria-label="Main navigation">
      {NAV_GROUP_ORDER.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        const groupKey = GROUP_I18N_KEYS[group];
        const groupLabel = groupKey ? t(groupKey) : group;
        return (
          <div key={group}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{groupLabel}</p>
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
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
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
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <BrandMark />
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
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card shadow-xl">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <BrandMark />
          <button onClick={onClose} aria-label="Close navigation" className="rounded-md p-1.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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

export function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">CG</span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">CoalGuard AI</span>
        <span className="text-[10px] text-muted-foreground">Ministry of Coal / CIL</span>
      </span>
    </Link>
  );
}
