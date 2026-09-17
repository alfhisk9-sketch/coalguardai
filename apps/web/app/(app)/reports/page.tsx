"use client";

import * as React from "react";
import { BarChart3, Download, FileSpreadsheet } from "lucide-react";
import type { ComplianceRecord, Incident, Inspection } from "@sih/types";
import { complianceApi } from "../../../lib/api/compliance";
import { inspectionsApi } from "../../../lib/api/inspections";
import { incidentsApi } from "../../../lib/api/incidents";
import { correctiveActionsApi } from "../../../lib/api/correctiveActions";
import { contractorsApi } from "../../../lib/api/contractors";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import { cn } from "../../../lib/utils";

type ReportKey = "compliance" | "inspections" | "incidents" | "correctiveActions" | "contractors" | "environmental" | "production";

interface ReportDef {
  key: ReportKey;
  label: string;
  description: string;
  /** false = no backend read endpoint; the report cannot be generated from real data. */
  available: boolean;
}

const REPORTS: ReportDef[] = [
  { key: "compliance", label: "Compliance report", description: "Compliance records, status and overdue items.", available: true },
  { key: "inspections", label: "Inspection report", description: "Inspections by status and schedule.", available: true },
  { key: "incidents", label: "Incident report", description: "Reported incidents by severity and status.", available: true },
  { key: "correctiveActions", label: "Corrective action report", description: "Open, overdue and verified actions.", available: true },
  { key: "contractors", label: "Contractor report", description: "Engaged contractors and their status.", available: true },
  { key: "environmental", label: "Environmental report", description: "Monitoring readings against configured thresholds.", available: false },
  { key: "production", label: "Production report", description: "Target versus actual output by period.", available: false },
];

interface Row {
  [key: string]: string;
}

export default function ReportsPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ReportKey>("compliance");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const def = REPORTS.find((r) => r.key === selected)!;

  const { data, loading, error, reload } = useAsync<{ columns: string[]; rows: Row[] } | null>(async () => {
    if (!mineId || !def.available) return null;
    const inRange = (d: string | null) => {
      if (!d) return true;
      const day = d.slice(0, 10);
      return (!from || day >= from) && (!to || day <= to);
    };

    if (selected === "compliance") {
      const records: ComplianceRecord[] = (await complianceApi.listRecords(mineId)).data;
      return {
        columns: ["Record", "Due date", "Completed", "Status"],
        rows: records.filter((r) => inRange(r.dueDate)).map((r) => ({
          Record: r.id.slice(0, 12), "Due date": r.dueDate, Completed: r.completedDate ?? "—", Status: r.status,
        })),
      };
    }
    if (selected === "inspections") {
      const items: Inspection[] = (await inspectionsApi.list(mineId)).data;
      return {
        columns: ["Type", "Scheduled", "Actual", "Status"],
        rows: items.filter((i) => inRange(i.scheduledDate)).map((i) => ({
          Type: i.inspectionType, Scheduled: i.scheduledDate ?? "—", Actual: i.actualDate ?? "—", Status: i.status,
        })),
      };
    }
    if (selected === "incidents") {
      const items: Incident[] = (await incidentsApi.list(mineId)).data;
      return {
        columns: ["Description", "Occurred", "Severity", "Status"],
        rows: items.filter((i) => inRange(i.occurredAt)).map((i) => ({
          Description: i.description.slice(0, 80), Occurred: i.occurredAt.slice(0, 10), Severity: i.severity, Status: i.status,
        })),
      };
    }
    if (selected === "correctiveActions") {
      const items = (await correctiveActionsApi.list(mineId)).data;
      return {
        columns: ["Issue", "Source", "Deadline", "Priority", "Status"],
        rows: items.filter((a) => inRange(a.deadline)).map((a) => ({
          Issue: a.issue.slice(0, 80), Source: a.sourceType, Deadline: a.deadline ?? "—", Priority: a.priority, Status: a.status,
        })),
      };
    }
    const items = (await contractorsApi.list(mineId)).data;
    return {
      columns: ["Company", "Status"],
      rows: items.map((c) => ({ Company: c.companyName, Status: c.status })),
    };
  }, [mineId, selected, from, to]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Query operational data by mine and date range."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelected(r.key)}
              aria-pressed={selected === r.key}
              className={cn(
                "w-full rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected === r.key ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{r.label}</span>
                {!r.available ? <Badge variant="secondary">Blocked</Badge> : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
            </button>
          ))}
        </div>

        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                {def.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={reload} disabled={!def.available}>Run</Button>
                <Button variant="outline" disabled title="Export is not supported by the backend yet">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {!def.available ? (
            <EmptyState
              title="This report cannot be generated yet"
              description="The backend exposes no read endpoint for this data, so running it would mean inventing figures. It is listed here so the report catalogue is complete and honest."
            />
          ) : loading ? (
            <LoadingState label="Running report…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !data || data.rows.length === 0 ? (
            <EmptyState title="No rows" description="No data matched this mine and date range." />
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">{data.rows.length} rows</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((c) => (
                      <TableHead key={c}>{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, i) => (
                    <TableRow key={i}>
                      {data.columns.map((c) => (
                        <TableCell key={c} className="text-sm">{row[c] ?? "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-md border border-border p-3 text-xs text-muted-foreground">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-foreground">PDF / Excel export: NOT IMPLEMENTED.</strong> No backend report
              generation or export endpoint exists. The Export control is disabled rather than producing a file that
              would not match a server-generated report.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
