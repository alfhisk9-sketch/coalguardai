"use client";

import * as React from "react";
import Link from "next/link";
import type { Inspection, InspectionObservation } from "@sih/types";
import { inspectionsApi } from "../../../lib/api/inspections";
import { observationsApi } from "../../../lib/api/observations";
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

interface Row {
  observation: InspectionObservation;
  inspection: Inspection;
}

export default function ObservationsPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [severity, setSeverity] = React.useState("ALL");

  // Composed from the two real endpoints: inspections for the mine, then each
  // inspection's observations. No aggregate observations endpoint exists.
  const { data, loading, error, reload } = useAsync<Row[]>(async () => {
    if (!mineId) return [];
    const inspections = (await inspectionsApi.list(mineId)).data;
    const nested = await Promise.all(
      inspections.map(async (inspection) => {
        try {
          const observations = (await observationsApi.list(inspection.id)).data;
          return observations.map((observation) => ({ observation, inspection }));
        } catch {
          return [] as Row[];
        }
      })
    );
    return nested.flat();
  }, [mineId]);

  const rows = (data ?? []).filter((r) => severity === "ALL" || r.observation.severity === severity);
  const critical = (data ?? []).filter((r) => r.observation.severity === "CRITICAL").length;
  const withEvidence = (data ?? []).filter((r) => r.observation.photoDocumentId !== null).length;

  return (
    <>
      <PageHeader
        title="Observations"
        description="Field observations recorded across inspections at the selected mine."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Observations" value={data?.length ?? 0} />
        <KpiCard label="Critical" value={critical} tone={critical > 0 ? "destructive" : "success"} />
        <KpiCard label="With evidence" value={withEvidence} />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Select aria-label="Filter by severity" className="w-52" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="ALL">All severities</option>
            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading observations…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No observations" description="No observations match the current mine and severity filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Observation</TableHead>
              <TableHead className="hidden md:table-cell">Inspection</TableHead>
              <TableHead className="hidden lg:table-cell">Recorded</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.observation.id}>
                <TableCell className="max-w-md">{r.observation.description}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link href={`/inspections/${r.inspection.id}`} className="text-primary hover:underline">
                    {r.inspection.inspectionType}
                  </Link>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-xs lg:table-cell">
                  {r.observation.clientCreatedAt ? formatDateTime(r.observation.clientCreatedAt) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={r.observation.photoDocumentId ? "success" : "secondary"}>
                    {r.observation.photoDocumentId ? "Attached" : "None"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.observation.severity)}>{r.observation.severity}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
