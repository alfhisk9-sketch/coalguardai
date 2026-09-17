"use client";

import Link from "next/link";
import type { Mine } from "@sih/types";
import { useAsync } from "../../lib/hooks/use-async";
import { minesApi } from "../../lib/api/mines";
import { dashboardApi } from "../../lib/api/dashboard";
import { complianceApi } from "../../lib/api/compliance";
import { incidentsApi } from "../../lib/api/incidents";
import { formatDate } from "../../lib/utils";
import { Badge, statusVariant } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { AiPanel } from "../common/ai-panel";

/** Loads the first mine in the user's scope, then that mine's operational picture. */
export function MineManagerDashboard() {
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

  if (loading) return <LoadingState label="Loading mine overview…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title="No mine assigned" description="Your account has no mine in scope yet." />;

  const { mine, dashboard, records, incidents } = data;
  const upcoming = records
    .filter((r) => r.status === "DUE_SOON" || r.status === "OVERDUE")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{mine.name}</p>
          <p className="text-xs text-muted-foreground">
            {mine.code} · {mine.mineType.replace("_", " ")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { window.location.href = `/mines/${mine.id}`; }}>
          Open mine profile
        </Button>
      </div>

      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label="Compliance"
          value={`${dashboard.complianceScore}%`}
          tone={dashboard.complianceScore >= 85 ? "success" : dashboard.complianceScore >= 60 ? "warning" : "destructive"}
        />
        <KpiCard label="Overdue items" value={dashboard.overdueCompliance} tone={dashboard.overdueCompliance > 0 ? "destructive" : "success"} />
        <KpiCard label="Open inspections" value={dashboard.openInspections} />
        <KpiCard label="Open incidents" value={dashboard.openIncidents} tone={dashboard.openIncidents > 0 ? "warning" : "success"} />
        <KpiCard label="Compliance records" value={records.length} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Requires attention</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing overdue or due soon" description="All tracked compliance records are current." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 12)}</TableCell>
                      <TableCell>{formatDate(r.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-3">
              <Link href="/compliance" className="text-xs font-medium text-primary hover:underline">
                View full compliance workspace →
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent incidents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {incidents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No incidents recorded for this mine.</p>
              ) : (
                incidents.slice(0, 4).map((i) => (
                  <div key={i.id} className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                    <p className="line-clamp-2 text-xs">{i.description}</p>
                    <Badge variant={statusVariant(i.severity)}>{i.severity}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <AiPanel mineId={mine.id} title={`${mine.name} AI Risk & Anomalies`} />
        </div>
      </div>
    </div>
  );
}
