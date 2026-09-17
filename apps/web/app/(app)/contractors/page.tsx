"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Contractor } from "@sih/types";
import { contractorsApi } from "../../../lib/api/contractors";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

export default function ContractorsPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("ALL");

  const { data, loading, error, reload } = useAsync<Contractor[]>(async () => {
    if (!mineId) return [];
    return (await contractorsApi.list(mineId)).data;
  }, [mineId]);

  const contractors = data ?? [];
  const rows = contractors.filter((c) => {
    const q = query.trim().toLowerCase();
    return (q === "" || c.companyName.toLowerCase().includes(q)) && (status === "ALL" || c.status === status);
  });
  const active = contractors.filter((c) => c.status === "ACTIVE").length;
  const suspended = contractors.filter((c) => c.status === "SUSPENDED").length;

  return (
    <>
      <PageHeader
        title="Contractors"
        description="Contractor organisations engaged at the selected mine."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard label="Contractors" value={contractors.length} />
        <KpiCard label="Active" value={active} tone="success" />
        <KpiCard label="Suspended" value={suspended} tone={suspended > 0 ? "destructive" : "default"} />
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search contractors" placeholder="Search by company name" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading contractors…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No contractors" description="No contractors match the current mine and filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="hidden md:table-cell">Contractor ID</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/contractors/${c.id}`} className="font-medium text-primary hover:underline">
                    {c.companyName}
                  </Link>
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{c.id.slice(0, 12)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
