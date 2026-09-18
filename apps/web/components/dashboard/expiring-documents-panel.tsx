"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export interface ExpiringDocumentsProps {
  expiredCount?: number;
  expiring7Count?: number;
  expiring30Count?: number;
  validCount?: number;
}

export function ExpiringDocumentsPanel({
  expiredCount = 1,
  expiring7Count = 2,
  expiring30Count = 5,
  validCount = 28,
}: ExpiringDocumentsProps) {
  const { t } = useI18n();

  const metrics = [
    {
      label: t("doc_status_expired"),
      count: expiredCount,
      icon: XCircle,
      tone: "destructive" as const,
      border: "border-destructive/30 bg-destructive/5 text-destructive",
    },
    {
      label: t("doc_status_expiring_7"),
      count: expiring7Count,
      icon: AlertTriangle,
      tone: "warning" as const,
      border: "border-warning/30 bg-warning/5 text-warning",
    },
    {
      label: t("doc_status_expiring_30"),
      count: expiring30Count,
      icon: Clock,
      tone: "secondary" as const,
      border: "border-border bg-secondary/20 text-foreground",
    },
    {
      label: t("doc_status_valid"),
      count: validCount,
      icon: CheckCircle2,
      tone: "success" as const,
      border: "border-success/30 bg-success/5 text-success",
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-sm font-bold tracking-tight">
              {t("expiring_documents_title")}
            </CardTitle>
          </div>
          <Link
            href="/documents"
            className="text-[11px] font-medium text-primary hover:underline"
          >
            {t("btn_view")} {t("documents")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`flex flex-col p-3 rounded-lg border ${m.border} transition-all duration-150 hover:shadow-xs`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-lg font-bold tabular-nums">{m.count}</span>
                </div>
                <span className="text-[11px] font-medium leading-tight text-muted-foreground line-clamp-1">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
