"use client";

import Link from "next/link";
import { Play, ClipboardList, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Inspection, Mine } from "@sih/types";
import { useAsync } from "../../lib/hooks/use-async";
import { minesApi } from "../../lib/api/mines";
import { inspectionsApi } from "../../lib/api/inspections";
import { formatDate } from "../../lib/utils";
import { useI18n } from "../../lib/i18n";
import { Badge, statusVariant } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";

function isToday(value: string | null): boolean {
  if (!value) return false;
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function InspectorDashboard() {
  const { t } = useI18n();

  const { data, loading, error, reload } = useAsync(async () => {
    const mines = (await minesApi.list()).data;
    const perMine = await Promise.all(
      mines.map(async (mine: Mine) => {
        try {
          return (await inspectionsApi.list(mine.id)).data;
        } catch {
          return [] as Inspection[];
        }
      })
    );
    return { mines, inspections: perMine.flat() };
  }, []);

  if (loading) return <LoadingState label={t("loading_label")} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { inspections } = data;
  const pending = inspections.filter((i) => i.status === "SCHEDULED" || i.status === "IN_PROGRESS");
  const today = inspections.filter((i) => isToday(i.scheduledDate));
  const completed = inspections.filter((i) => i.status === "APPROVED" || i.status === "SUBMITTED" || i.status === "REVIEWED");

  return (
    <div className="space-y-5">
      <Card className="border-primary/40 bg-primary/5 shadow-xs">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold text-foreground">{t("ready_field")}</p>
            <p className="text-xs text-muted-foreground">{t("ready_field_desc")}</p>
          </div>
          <Button asChild className="gap-1.5 shadow-sm">
            <Link href="/inspections/new">
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>{t("btn_start_inspection")}</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("kpi_assigned")}
          value={inspections.length}
          icon={ClipboardList}
        />
        <KpiCard
          label={t("kpi_today")}
          value={today.length}
          tone={today.length > 0 ? "warning" : "default"}
          icon={Clock}
        />
        <KpiCard
          label={t("pending_label")}
          value={pending.length}
          tone={pending.length > 0 ? "warning" : "default"}
          icon={AlertCircle}
        />
        <KpiCard
          label={t("status_completed")}
          value={completed.length}
          tone="success"
          icon={CheckCircle2}
        />
      </section>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold tracking-tight">
            {t("your_inspections")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {inspections.length === 0 ? (
            <EmptyState
              title={t("no_inspections_assigned")}
              description={t("no_inspections_desc")}
            />
          ) : (
            inspections.slice(0, 10).map((i) => (
              <Link
                key={i.id}
                href={`/inspections/${i.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{i.inspectionType}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("scheduled_on")} {formatDate(i.scheduledDate)}
                  </p>
                </div>
                <Badge variant={statusVariant(i.status)} className="text-[10px]">
                  {t(`status_${i.status.toLowerCase()}` as any) || i.status.replace(/_/g, " ")}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
