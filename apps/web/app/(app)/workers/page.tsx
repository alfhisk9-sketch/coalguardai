"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { mockApi, type MockWorker } from "../../../lib/api/mock";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

/**
 * DEMO DATA. Workers are readable per-contractor via /api/contractors/:id/workers, but
 * there is no cross-contractor worker listing endpoint. See docs/C2_HANDOFF.md.
 */
export default function WorkersPage() {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const { data, loading, error, reload } = useAsync<MockWorker[]>(() => mockApi.listWorkers(), []);

  const workers = data ?? [];
  const rows = workers.filter((w) => {
    const q = query.trim().toLowerCase();
    const matches = q === "" || w.fullName.toLowerCase().includes(q) || w.contractorName.toLowerCase().includes(q);
    return matches && (status === "ALL" || w.status === status);
  });

  return (
    <>
      <PageHeader title="Workers" description="Contractor workforce registered across mines." demo />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Workers" value={workers.length} />
        <KpiCard label="Active" value={workers.filter((w) => w.status === "ACTIVE").length} tone="success" />
        <KpiCard label="Contractors" value={new Set(workers.map((w) => w.contractorName)).size} />
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search workers" placeholder="Search by worker or contractor" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading workers…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No workers" description="No workers match the current filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead className="hidden sm:table-cell">Contractor</TableHead>
              <TableHead className="hidden lg:table-cell">Mine</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.fullName}</TableCell>
                <TableCell className="hidden sm:table-cell">{w.contractorName}</TableCell>
                <TableCell className="hidden lg:table-cell">{w.mineName}</TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{w.category}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(w.status)}>{w.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
