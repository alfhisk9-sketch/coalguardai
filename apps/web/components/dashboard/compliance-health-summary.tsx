"use client";

import * as React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export interface ComplianceHealthSummaryProps {
  score?: number;
  breakdown?: {
    safety?: number;
    environmental?: number;
    labour?: number;
    documents?: number;
    inspections?: number;
    capa?: number;
  };
  isDemoFallback?: boolean;
}

export function ComplianceHealthSummary({
  score = 82,
  breakdown = {
    safety: 88,
    environmental: 78,
    labour: 85,
    documents: 74,
    inspections: 90,
    capa: 80,
  },
  isDemoFallback = false,
}: ComplianceHealthSummaryProps) {
  const { t } = useI18n();

  const categories = [
    { label: t("breakdown_safety"), value: breakdown.safety ?? 88 },
    { label: t("breakdown_environmental"), value: breakdown.environmental ?? 78 },
    { label: t("breakdown_labour"), value: breakdown.labour ?? 85 },
    { label: t("breakdown_documents"), value: breakdown.documents ?? 74 },
    { label: t("breakdown_inspections"), value: breakdown.inspections ?? 90 },
    { label: t("breakdown_capa"), value: breakdown.capa ?? 80 },
  ];

  const getBarColor = (val: number) => {
    if (val >= 85) return "bg-success";
    if (val >= 60) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            <CardTitle className="text-sm font-bold tracking-tight">
              {t("compliance_health_title")}
            </CardTitle>
          </div>
          {isDemoFallback ? (
            <Badge variant="secondary" className="text-[10px]">
              Demo Baseline
            </Badge>
          ) : (
            <Badge variant="success" className="text-[10px]">
              Active Telemetry
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Overall Progress Gauge */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("overall_compliance")}
            </span>
            <span className="text-2xl font-black tabular-nums text-foreground">
              {score}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t("overall_compliance")}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3 inline text-muted-foreground/80 shrink-0" />
            <span>{t("breakdown_score_desc")}</span>
          </p>
        </div>

        {/* 6 Category Breakdown Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {categories.map((cat) => (
            <div key={cat.label} className="rounded-md border border-border/80 bg-card p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground truncate">{cat.label}</span>
                <span className="font-bold tabular-nums text-foreground ml-2">{cat.value}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(cat.value)}`}
                  style={{ width: `${Math.min(100, Math.max(0, cat.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
