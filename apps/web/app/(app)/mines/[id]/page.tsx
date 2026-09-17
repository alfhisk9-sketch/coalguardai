"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { minesApi } from "../../../../lib/api/mines";
import { dashboardApi } from "../../../../lib/api/dashboard";
import { complianceApi } from "../../../../lib/api/compliance";
import { inspectionsApi } from "../../../../lib/api/inspections";
import { incidentsApi } from "../../../../lib/api/incidents";
import { useAsync } from "../../../../lib/hooks/use-async";
import { formatDate } from "../../../../lib/utils";
import { PageHeader } from "../../../../components/common/page-header";
import { KpiCard } from "../../../../components/common/kpi-card";
import { AiPanel } from "../../../../components/common/ai-panel";
import { Badge, statusVariant } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../../components/ui/data-states";
import { cn } from "../../../../lib/utils";

const TABS = ["Overview", "Compliance", "Inspections", "Incidents"] as const;
type Tab = (typeof TABS)[number];

export default function MineDetailPage() {
  const params = useParams<{ id: string }>();
  const mineId = params.id;
  const [tab, setTab] = React.useState<Tab>("Overview");

  const { data, loading, error, reload } = useAsync(async () => {
    const mines = (await minesApi.list()).data;
    const mine = mines.find((m) => m.id === mineId) ?? null;
    if (!mine) return null;
    const [dashboard, records, inspections, incidents] = await Promise.all([
      dashboardApi.forMine(mineId).then((r) => r.data).catch(() => null),
      complianceApi.listRecords(mineId).then((r) => r.data).catch(() => []),
      inspectionsApi.list(mineId).then((r) => r.data).catch(() => []),
      incidentsApi.list(mineId).then((r) => r.data).catch(() => []),
    ]);
    return { mine, dashboard, records, inspections, incidents };
  }, [mineId]);

  if (loading) return <LoadingState label="Loading mine…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title="Mine not found" description="This mine does not exist or is not in your authorized scope." />;

  const { mine, dashboard, records, inspections, incidents } = data;

  return (
    <>
      <PageHeader
        title={mine.name}
        description={`${mine.code} · ${mine.mineType.replace("_", " ")} · ${mine.status}`}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Compliance"
          value={dashboard ? `${dashboard.complianceScore}%` : "—"}
          tone={!dashboard ? "default" : dashboard.complianceScore >= 85 ? "success" : dashboard.complianceScore >= 60 ? "warning" : "destructive"}
        />
        <KpiCard label="Overdue" value={dashboard?.overdueCompliance ?? "—"} tone={(dashboard?.overdueCompliance ?? 0) > 0 ? "destructive" : "success"} />
        <KpiCard label="Open inspections" value={dashboard?.openInspections ?? "—"} />
        <KpiCard label="Open incidents" value={dashboard?.openIncidents ?? "—"} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Mine sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Mine details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Code</dt>
                  <dd className="font-medium">{mine.code}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="font-medium">{mine.mineType.replace("_", " ")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={statusVariant(mine.status)}>{mine.status}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Coordinates</dt>
                  <dd className="font-mono text-xs">
                    {mine.latitude !== null && mine.longitude !== null ? `${mine.latitude}, ${mine.longitude}` : "Not recorded"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <AiPanel title="AI Mine Summary" mineId={mine.id} mode="summary" />
        </div>
      ) : null}

      {tab === "Compliance" ? (
        records.length === 0 ? (
          <EmptyState title="No compliance records" description="No compliance records exist for this mine." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id.slice(0, 12)}</TableCell>
                  <TableCell>{formatDate(r.dueDate)}</TableCell>
                  <TableCell>{formatDate(r.completedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : null}

      {tab === "Inspections" ? (
        inspections.length === 0 ? (
          <EmptyState title="No inspections" description="No inspections have been recorded for this mine." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.inspectionType}</TableCell>
                  <TableCell>{formatDate(i.scheduledDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(i.status)}>{i.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : null}

      {tab === "Incidents" ? (
        incidents.length === 0 ? (
          <EmptyState title="No incidents" description="No incidents have been reported for this mine." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Occurred</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="max-w-sm truncate">{i.description}</TableCell>
                  <TableCell>{formatDate(i.occurredAt)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(i.severity)}>{i.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(i.status)}>{i.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : null}
    </>
  );
}
