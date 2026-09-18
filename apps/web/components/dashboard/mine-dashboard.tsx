"use client";

import Link from "next/link";
import { ShieldAlert, ClipboardList, TriangleAlert, FileCheck2, Mountain } from "lucide-react";
import type { Mine } from "@sih/types";
import { useAsync } from "../../lib/hooks/use-async";
import { minesApi } from "../../lib/api/mines";
import { dashboardApi } from "../../lib/api/dashboard";
import { complianceApi } from "../../lib/api/compliance";
import { incidentsApi } from "../../lib/api/incidents";
import { formatDate } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { Badge, statusVariant } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { AiPanel } from "../common/ai-panel";

/** Loads the first mine in the user's scope, then that mine's operational picture. */
export function MineManagerDashboard() {
  const { t } = useI18n();

  const { data, loading, error, reload } = useAsync(async () => {
    const mines = (await minesApi.list()).data;
    const mine: Mine | undefined = mines[0];
    if (!mine) return null;
    const [dashboard, records, incidents] = await Promise.all([
      dashboardApi.forMine(mine.id).then((r) => r.data),
      complianceApi.listRecords(mine.id).then((r) => r.data),
      incidentsApi.list(mine.id).then((r) => r.data).catch(() => []),
    ]);
    return { mine, dashboard, records, incidents };
  }, []);

  if (loading) return <LoadingState label={t("loading_label")} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title={t("empty_records")} description="Your account has no mine in scope yet." />;

  const { mine, dashboard, records, incidents } = data;
  const upcoming = records
    .filter((r) => r.status === "DUE_SOON" || r.status === "OVERDUE")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-card shadow-xs">
        <div>
          <p className="text-base font-bold text-foreground">{mine.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {mine.code} · {mine.mineType.replace("_", " ")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            window.location.href = `/mines/${mine.id}`;
          }}
        >
          {t("open_mine_profile")}
        </Button>
      </div>

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label={t("kpi_compliance_score")}
          value={`${dashboard.complianceScore}%`}
          tone={dashboard.complianceScore >= 85 ? "success" : dashboard.complianceScore >= 60 ? "warning" : "destructive"}
          icon={FileCheck2}
        />
        <KpiCard
          label={t("kpi_overdue_compliance")}
          value={dashboard.overdueCompliance}
          tone={dashboard.overdueCompliance > 0 ? "destructive" : "success"}
          icon={ShieldAlert}
        />
        <KpiCard
          label={t("kpi_open_inspections")}
          value={dashboard.openInspections}
          icon={ClipboardList}
        />
        <KpiCard
          label={t("kpi_open_incidents")}
          value={dashboard.openIncidents}
          tone={dashboard.openIncidents > 0 ? "warning" : "success"}
          icon={TriangleAlert}
        />
        <KpiCard
          label={t("compliance_records")}
          value={records.length}
          icon={Mountain}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold tracking-tight">
              {t("requires_attention")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {upcoming.length === 0 ? (
              <EmptyState title={t("nothing_overdue")} description={t("all_records_current")} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">{t("record_header")}</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider">{t("due_header")}</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-right">{t("status_label")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((r) => (
                      <TableRow key={r.id} className="hover:bg-secondary/40">
                        <TableCell className="font-mono text-xs">{r.id.slice(0, 12)}</TableCell>
                        <TableCell className="text-xs">{formatDate(r.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={statusVariant(r.status)} className="text-[10px]">
                            {t(`status_${r.status.toLowerCase()}` as any) || r.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-border/40">
              <Link href="/compliance" className="text-xs font-semibold text-primary hover:underline">
                {t("btn_view")} {t("nav_compliance")} →
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold tracking-tight">
                {t("nav_incidents")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {incidents.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("empty_records")}</p>
              ) : (
                incidents.slice(0, 4).map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{i.description}</p>
                    <Badge variant={statusVariant(i.severity)} className="text-[9px]">
                      {t(`severity_${i.severity.toLowerCase()}` as any) || i.severity}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <AiPanel mineId={mine.id} title={`${mine.name} ${t("ai_telemetry_title")}`} />
        </div>
      </div>
    </div>
  );
}
