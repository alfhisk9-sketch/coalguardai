"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { Inspection, Mine } from "@sih/types";
import { useAsync } from "../../lib/hooks/use-async";
import { minesApi } from "../../lib/api/mines";
import { inspectionsApi } from "../../lib/api/inspections";
import { formatDate } from "../../lib/utils";
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

  if (loading) return <LoadingState label="Loading your assignments…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const { inspections } = data;
  const pending = inspections.filter((i) => i.status === "SCHEDULED" || i.status === "IN_PROGRESS");
  const today = inspections.filter((i) => isToday(i.scheduledDate));
  const completed = inspections.filter((i) => i.status === "APPROVED" || i.status === "SUBMITTED" || i.status === "REVIEWED");

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Ready to go into the field?</p>
            <p className="text-xs text-muted-foreground">Start a guided inspection with GPS capture and observation recording.</p>
          </div>
          <Button asChild>
            <Link href="/inspections/new">
              <Play className="h-4 w-4" aria-hidden="true" />
              Start inspection
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Assigned" value={inspections.length} />
        <KpiCard label="Today" value={today.length} tone={today.length > 0 ? "warning" : "default"} />
        <KpiCard label="Pending" value={pending.length} />
        <KpiCard label="Completed" value={completed.length} tone="success" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your inspections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {inspections.length === 0 ? (
            <EmptyState
              title="No inspections assigned"
              description="Scheduled inspections for mines in your scope will appear here."
            />
          ) : (
            inspections.slice(0, 10).map((i) => (
              <Link
                key={i.id}
                href={`/inspections/${i.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.inspectionType}</p>
                  <p className="text-xs text-muted-foreground">Scheduled {formatDate(i.scheduledDate)}</p>
                </div>
                <Badge variant={statusVariant(i.status)}>{i.status.replace(/_/g, " ")}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
