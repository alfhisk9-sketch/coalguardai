"use client";

import * as React from "react";
import type { ComplianceRecord } from "@sih/types";
import { complianceApi } from "../../../lib/api/compliance";
import { useAsync } from "../../../lib/hooks/use-async";
import { useAuth } from "../../../lib/auth/provider";
import { formatDate } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

const STATUSES: ComplianceRecord["status"][] = ["COMPLIANT", "DUE_SOON", "OVERDUE", "NON_COMPLIANT", "UNDER_REVIEW", "NOT_APPLICABLE"];

export default function CompliancePage() {
  const { can } = useAuth();
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState("ALL");
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    if (!mineId) return [] as ComplianceRecord[];
    return (await complianceApi.listRecords(mineId)).data;
  }, [mineId]);

  const records = data ?? [];
  const filtered = status === "ALL" ? records : records.filter((r) => r.status === status);
  const overdue = records.filter((r) => r.status === "OVERDUE").length;
  const compliant = records.filter((r) => r.status === "COMPLIANT").length;
  const score = records.length === 0 ? 0 : Math.round((compliant / records.length) * 100);

  async function markCompliant(record: ComplianceRecord) {
    if (savingId) return; // prevents duplicate submissions
    setSavingId(record.id);
    setActionError(null);
    try {
      await complianceApi.updateRecord(record.id, {
        status: "COMPLIANT",
        completedDate: new Date().toISOString().slice(0, 10),
      });
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update this record.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Compliance"
        description="Statutory and operational compliance records tracked per mine."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Records" value={records.length} />
        <KpiCard label="Compliance score" value={`${score}%`} tone={score >= 85 ? "success" : score >= 60 ? "warning" : "destructive"} />
        <KpiCard label="Overdue" value={overdue} tone={overdue > 0 ? "destructive" : "success"} />
        <KpiCard label="Compliant" value={compliant} tone="success" />
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Select aria-label="Filter by status" className="w-52" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of {records.length}
          </span>
        </CardContent>
      </Card>

      {actionError ? (
        <p role="alert" className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <LoadingState label="Loading compliance records…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No compliance records" description="No records match the current mine and status filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="hidden md:table-cell">Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              {can("compliance.manage") ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id.slice(0, 12)}</TableCell>
                <TableCell>{formatDate(r.dueDate)}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDate(r.completedDate)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground lg:table-cell">{r.notes ?? "—"}</TableCell>
                {can("compliance.manage") ? (
                  <TableCell className="text-right">
                    {r.status === "COMPLIANT" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <Button size="sm" variant="outline" disabled={savingId === r.id} onClick={() => markCompliant(r)}>
                        {savingId === r.id ? "Saving…" : "Record compliance"}
                      </Button>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
