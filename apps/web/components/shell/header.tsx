"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import type { RoleKey } from "@sih/config";
import { ROLE_KEYS } from "@sih/config";
import { useAuth } from "../../lib/auth/provider";
import { NAMED_DEMO_ACCOUNTS } from "../../lib/auth/demo";
import { useI18n } from "../../lib/i18n";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { BrandLogo } from "./brand-logo";
import { LanguageSelector } from "./language-selector";
import { NotificationCenter } from "./notification-center";

const PATH_I18N_MAP: Record<string, string> = {
  "/dashboard": "nav_dashboard",
  "/mines": "nav_mines",
  "/map": "nav_map",
  "/compliance": "nav_compliance",
  "/inspections": "nav_inspections",
  "/observations": "nav_observations",
  "/incidents": "nav_incidents",
  "/corrective-actions": "nav_corrective_actions",
  "/contractors": "nav_contractors",
  "/workers": "nav_workers",
  "/attendance": "nav_attendance",
  "/environmental": "nav_environmental",
  "/production": "nav_production",
  "/documents": "nav_documents",
  "/assistant": "nav_assistant",
  "/notifications": "nav_notifications",
  "/grievances": "nav_grievances",
  "/audit": "nav_audit",
  "/reports": "nav_reports",
  "/admin": "nav_admin",
};

export function formatRoleLabel(roleKey: RoleKey | null | undefined): string {
  if (!roleKey) return "Role Pending";
  switch (roleKey) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "CORPORATE_ADMIN":
      return "Corporate Admin";
    case "MINE_MANAGER":
      return "Mine Manager";
    case "REGULATOR":
      return "Safety Officer";
    case "INSPECTOR":
      return "Inspector";
    case "CONTRACTOR":
      return "Contractor";
    default:
      return String(roleKey).replace(/_/g, " ");
  }
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ctx, primaryRole, isDemo, setDemoRole, signOut } = useAuth();
  const { t } = useI18n();

  const persona = primaryRole ? NAMED_DEMO_ACCOUNTS[primaryRole] : null;
  const displayName = ctx?.userName || persona?.name || ctx?.userId || "User";
  const roleLabel = formatRoleLabel(primaryRole);

  // Determine current page breadcrumb
  const matchedKey = Object.entries(PATH_I18N_MAP).find(([path]) =>
    pathname === path || pathname.startsWith(`${path}/`)
  )?.[1];
  const pageTitle = matchedKey ? t(matchedKey as any) : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-4 shadow-sm">
      {/* Left section: mobile toggle + logo + breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="lg:hidden">
          <BrandLogo size="sm" withSubtitle={false} />
        </div>

        {/* Breadcrumb indicator */}
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <span className="font-semibold text-foreground/80">CoalGuard AI</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
          <span className="font-medium text-foreground">{pageTitle}</span>
          {isDemo ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-500 uppercase">
              DEMO ENVIRONMENT
            </span>
          ) : null}
        </div>
      </div>

      {/* Right section: Language selector + Persona selector (demo) + Notification center + User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Language selector */}
        <LanguageSelector />

        {/* Demo persona switcher if in demo mode */}
        {isDemo ? (
          <div className="hidden items-center gap-1.5 xl:flex">
            <label htmlFor="demo-role-header" className="text-[11px] text-muted-foreground whitespace-nowrap">
              {t("demo_role_label")}:
            </label>
            <Select
              id="demo-role-header"
              className="h-7 w-48 text-xs font-medium"
              value={primaryRole ?? "CORPORATE_ADMIN"}
              onChange={(e) => setDemoRole(e.target.value as RoleKey)}
            >
              {ROLE_KEYS.map((r) => {
                const p = NAMED_DEMO_ACCOUNTS[r];
                return (
                  <option key={r} value={r}>
                    {p.name} — {p.roleLabel}
                  </option>
                );
              })}
            </Select>
          </div>
        ) : null}

        {/* Global Notification Center */}
        <NotificationCenter />

        {/* User Identity Banner */}
        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-sm"
            title={`${displayName} (${roleLabel})`}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight text-left sm:block max-w-[130px] truncate">
            <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
          {isDemo ? (
            <Badge variant="warning" className="hidden lg:inline-flex text-[9px] px-1.5 py-0">
              Demo
            </Badge>
          ) : null}
        </div>

        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("sign_out")}
          title={t("sign_out")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
