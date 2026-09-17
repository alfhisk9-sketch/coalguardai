"use client";

import * as React from "react";
import type { Incident } from "@sih/types";
import { incidentsApi } from "../../../lib/api/incidents";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDateTime } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

export default function IncidentsPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [severity, setSeverity] = React.useState("ALL");

  const { data, loading, error, reload } = useAsync(async () => {
    if (!mineId) return [] as Incident[];
    return (await incidentsApi.list(mineId)).data;
  }, [mineId]);

  const incidents = data ?? [];
  const rows = severity === "ALL" ? incidents : incidents.filter((i) => i.severity === severity);
  const open = incidents.filter((i) => i.status !== "CLOSED" && i.status !== "RESOLVED").length;
  const critical = incidents.filter((i) => i.severity === "CRITICAL").length;

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Safety incidents reported at your authorized mines."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Total" value={incidents.length} />
        <KpiCard label="Open" value={open} tone={open > 0 ? "warning" : "success"} />
        <KpiCard label="Critical" value={critical} tone={critical > 0 ? "destructive" : "success"} />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Select aria-label="Filter by severity" className="w-52" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading incidents…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No incidents" description="No incidents match the current mine and severity filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Occurred</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="max-w-md">{i.description}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDateTime(i.occurredAt)}</TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                  {i.latitude !== null && i.longitude !== null ? `${i.latitude.toFixed(3)}, ${i.longitude.toFixed(3)}` : "Not recorded"}
                </TableCell>
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
      )}
    </>
  );
}
