"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, User } from "lucide-react";
import type { RoleKey } from "@sih/config";
import { ROLE_KEYS } from "@sih/config";
import { useAuth } from "../../lib/auth/provider";
import { NAMED_DEMO_ACCOUNTS } from "../../lib/auth/demo";
import { useI18n } from "../../lib/i18n";
import { notificationsApi } from "../../lib/api/notifications";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { BrandMark } from "./sidebar";
import { LanguageSelector } from "./language-selector";

const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  CORPORATE_ADMIN: "Corporate Admin",
  MINE_MANAGER: "Mine Manager",
  INSPECTOR: "Inspector",
  CONTRACTOR: "Contractor",
  REGULATOR: "Regulator",
};

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { ctx, primaryRole, isDemo, setDemoRole } = useAuth();
  const { t } = useI18n();
  const [unread, setUnread] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    notificationsApi
      .list()
      .then((res) => {
        if (!cancelled) setUnread(res.data.filter((n) => !n.isRead).length);
      })
      .catch(() => {
        if (!cancelled) setUnread(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persona = primaryRole ? NAMED_DEMO_ACCOUNTS[primaryRole] : null;
  const displayName = ctx?.userName || persona?.name || ctx?.userId || "User";
  const roleLabel = primaryRole ? (t(`role_${primaryRole.toLowerCase()}` as any) || ROLE_LABELS[primaryRole]) : t("no_role");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-4">
      <button
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="rounded-md p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="lg:hidden">
        <BrandMark />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Language selector for English, Hindi, Telugu */}
        <LanguageSelector />

        {/* Demo persona switcher */}
        {isDemo ? (
          <div className="hidden items-center gap-2 sm:flex">
            <label htmlFor="demo-role" className="text-xs text-muted-foreground whitespace-nowrap">
              {t("demo_role_label")}
            </label>
            <Select
              id="demo-role"
              className="h-8 w-52 text-xs"
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

        <Link
          href="/notifications"
          aria-label={unread ? `${t("notifications_label")}, ${unread} ${t("unread_label")}` : t("notifications_label")}
          className="relative rounded-md p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread && unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>

        {/* User Identity Banner: Shows logged-in person's display name and role */}
        <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
          {isDemo ? (
            <Badge variant="warning" className="hidden md:inline-flex">
              Demo
            </Badge>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={t("sign_out")}
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
