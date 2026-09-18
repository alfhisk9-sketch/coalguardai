"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertTriangle,
  Eye,
  ListChecks,
  Map,
  Bell,
  Bot,
  Plus,
} from "lucide-react";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import type { PermissionKey } from "@sih/config";

interface ActionItem {
  key: string;
  labelKey: any;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: PermissionKey;
  tone?: "primary" | "warning" | "destructive" | "secondary";
}

const ALL_ACTIONS: ActionItem[] = [
  {
    key: "start_inspection",
    labelKey: "qa_start_inspection",
    href: "/inspections/new",
    icon: ClipboardList,
    permission: "inspections.create",
    tone: "primary",
  },
  {
    key: "report_incident",
    labelKey: "qa_report_incident",
    href: "/incidents",
    icon: AlertTriangle,
    permission: "incidents.create",
    tone: "destructive",
  },
  {
    key: "add_observation",
    labelKey: "qa_add_observation",
    href: "/observations",
    icon: Eye,
    permission: "inspections.view",
    tone: "warning",
  },
  {
    key: "create_capa",
    labelKey: "qa_create_capa",
    href: "/corrective-actions",
    icon: ListChecks,
    permission: "compliance.view",
    tone: "secondary",
  },
  {
    key: "view_map",
    labelKey: "qa_view_map",
    href: "/map",
    icon: Map,
    permission: "mines.view",
    tone: "secondary",
  },
  {
    key: "review_alerts",
    labelKey: "qa_review_alerts",
    href: "/notifications",
    icon: Bell,
    permission: "dashboard.view",
    tone: "secondary",
  },
  {
    key: "open_assistant",
    labelKey: "qa_open_assistant",
    href: "/assistant",
    icon: Bot,
    permission: "ai.view",
    tone: "primary",
  },
];

export function QuickActionsBar() {
  const { ctx } = useAuth();
  const { t } = useI18n();
  const permissions = ctx?.permissions ?? [];

  const availableActions = ALL_ACTIONS.filter((act) => permissions.includes(act.permission));

  if (availableActions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {t("quick_actions_title")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.key}
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary hover:text-foreground hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t(action.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
