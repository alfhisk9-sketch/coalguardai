"use client";

import * as React from "react";
import { mockApi, type MockReading } from "../../../lib/api/mock";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDateTime } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import { cn } from "../../../lib/utils";

/** DEMO DATA. /api/environmental/readings is POST-only in C1. */
export default function EnvironmentalPage() {
  const [parameter, setParameter] = React.useState("ALL");
  const { data, loading, error, reload } = useAsync<MockReading[]>(() => mockApi.listEnvironmentalReadings(), []);

  const readings = data ?? [];
  const rows = parameter === "ALL" ? readings : readings.filter((r) => r.parameterType === parameter);
  const exceeded = readings.filter((r) => r.status === "EXCEEDED").length;
  const warning = readings.filter((r) => r.status === "WARNING").length;

  return (
    <>
      <PageHeader title="Environmental monitoring" description="Air, dust, water, noise and land readings from monitoring points." demo />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Readings" value={readings.length} />
        <KpiCard label="Warning" value={warning} tone={warning > 0 ? "warning" : "success"} />
        <KpiCard label="Exceeded" value={exceeded} tone={exceeded > 0 ? "destructive" : "success"} />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Select aria-label="Filter by parameter" className="w-56" value={parameter} onChange={(e) => setParameter(e.target.value)}>
            <option value="ALL">All parameters</option>
            {["AIR_QUALITY", "DUST", "WATER", "NOISE", "LAND"].map((p) => (
              <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading readings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No readings" description="No readings match the selected parameter." />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const pct = Math.min(100, Math.round((r.value / r.thresholdValue) * 100));
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{r.parameterType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{r.locationName}</p>
                    </div>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums">{r.value}</span>
                    <span className="text-xs text-muted-foreground">{r.unit}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Configured limit {r.thresholdValue} {r.unit}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full", r.status === "EXCEEDED" ? "bg-destructive" : r.status === "WARNING" ? "bg-warning" : "bg-success")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">Recorded {formatDateTime(r.recordedAt)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
        Thresholds shown are configurable demonstration values entered in this system. They are <strong>not</strong>
        official regulatory limits and must not be read as a statement of statutory compliance.
      </p>
    </>
  );
}
