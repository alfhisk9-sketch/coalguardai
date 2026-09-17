"use client";

import * as React from "react";
import type { CorrectiveAction } from "@sih/types";
import { correctiveActionsApi } from "../../../lib/api/correctiveActions";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDate } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import { cn } from "../../../lib/utils";

const FLOW = ["OPEN", "IN_PROGRESS", "COMPLETED", "VERIFIED"] as const;

export default function CorrectiveActionsPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("ALL");
  const [priority, setPriority] = React.useState("ALL");

  // Real API, via the mine-scoped GET route added by Account 2.
  const { data, loading, error, reload } = useAsync<CorrectiveAction[]>(async () => {
    if (!mineId) return [];
    return (await correctiveActionsApi.list(mineId)).data;
  }, [mineId]);

  const actions = data ?? [];
  const rows = actions.filter(
    (a) => (status === "ALL" || a.status === status) && (priority === "ALL" || a.priority === priority)
  );
  const overdue = actions.filter((a) => a.status === "OVERDUE").length;
  const open = actions.filter((a) => a.status === "OPEN" || a.status === "IN_PROGRESS").length;

  return (
    <>
      <PageHeader
        title="Corrective actions"
        description="Actions raised from inspections, incidents and compliance findings."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Total" value={actions.length} />
        <KpiCard label="Open" value={open} tone={open > 0 ? "warning" : "success"} />
        <KpiCard label="Overdue" value={overdue} tone={overdue > 0 ? "destructive" : "success"} />
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select aria-label="Filter by status" className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {["OPEN", "IN_PROGRESS", "COMPLETED", "VERIFIED", "OVERDUE"].map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Select aria-label="Filter by priority" className="w-44" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="ALL">All priorities</option>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <ol className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground lg:flex">
            {FLOW.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5">
                <span className={cn("rounded-full border border-border px-2 py-0.5")}>{s.replace(/_/g, " ")}</span>
                {i < FLOW.length - 1 ? <span>→</span> : null}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading corrective actions…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No corrective actions" description="No actions match the current filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead className="hidden sm:table-cell">Source</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="max-w-md font-medium">{a.issue}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline">{a.sourceType}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(a.deadline)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(a.priority)}>{a.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(a.status)}>{a.status.replace(/_/g, " ")}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
