"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Inspection } from "@sih/types";
import { inspectionsApi } from "../../../lib/api/inspections";
import { useAsync } from "../../../lib/hooks/use-async";
import { useAuth } from "../../../lib/auth/provider";
import { formatDate } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

const WORKFLOW: Inspection["status"][] = ["SCHEDULED", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"];

export default function InspectionsPage() {
  const { can } = useAuth();
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("ALL");

  const { data, loading, error, reload } = useAsync(async () => {
    if (!mineId) return [] as Inspection[];
    return (await inspectionsApi.list(mineId)).data;
  }, [mineId]);

  const rows = (data ?? []).filter((i) => status === "ALL" || i.status === status);

  return (
    <>
      <PageHeader
        title="Inspections"
        description="Scheduled, in-progress and completed inspections across your authorized mines."
        actions={
          <div className="flex items-center gap-2">
            <MinePicker value={mineId} onChange={setMineId} />
            {can("inspections.create") ? (
              <Button asChild>
                <Link href="/inspections/new">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select aria-label="Filter by status" className="w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {WORKFLOW.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Workflow: Scheduled → In progress → Submitted → Reviewed → Approved
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading inspections…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No inspections"
          description="No inspections match the current mine and status filter."
          action={
            can("inspections.create") ? (
              <Button asChild className="mt-2">
                <Link href="/inspections/new">Start an inspection</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead className="hidden md:table-cell">Actual</TableHead>
              <TableHead className="hidden lg:table-cell">GPS</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <Link href={`/inspections/${i.id}`} className="font-medium text-primary hover:underline">
                    {i.inspectionType}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(i.scheduledDate)}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(i.actualDate)}</TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                  {i.latitude !== null && i.longitude !== null ? `${i.latitude.toFixed(3)}, ${i.longitude.toFixed(3)}` : "Not captured"}
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
