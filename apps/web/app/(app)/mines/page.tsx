"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { riskBand, useMinePortfolio } from "../../../lib/hooks/use-portfolio";
import { PageHeader } from "../../../components/common/page-header";
import { ScoreBar } from "../../../components/common/score-bar";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

export default function MinesPage() {
  const { data, loading, error, reload } = useMinePortfolio();
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("ALL");
  const [risk, setRisk] = React.useState("ALL");

  const rows = (data ?? []).filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = q === "" || r.mine.name.toLowerCase().includes(q) || r.mine.code.toLowerCase().includes(q);
    const matchesType = type === "ALL" || r.mine.mineType === type;
    const matchesRisk = risk === "ALL" || riskBand(r) === risk;
    return matchesQuery && matchesType && matchesRisk;
  });

  return (
    <>
      <PageHeader title="Mines" description="Every mine in your authorized scope, with current compliance and risk posture." />

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search mines"
              placeholder="Search by name or code"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select aria-label="Filter by mine type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All mine types</option>
            <option value="OPEN_CAST">Open cast</option>
            <option value="UNDERGROUND">Underground</option>
            <option value="MIXED">Mixed</option>
          </Select>
          <Select aria-label="Filter by risk band" value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="ALL">All risk bands</option>
            <option value="HIGH">High risk</option>
            <option value="MEDIUM">Medium risk</option>
            <option value="LOW">Low risk</option>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading mines…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No mines match these filters" description="Adjust your search or filters to see results." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mine</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="w-40">Compliance</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const band = riskBand(row);
              return (
                <TableRow key={row.mine.id}>
                  <TableCell>
                    <Link href={`/mines/${row.mine.id}`} className="font-medium text-primary hover:underline">
                      {row.mine.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.mine.code}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{row.mine.mineType.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                    {row.mine.latitude !== null && row.mine.longitude !== null
                      ? `${row.mine.latitude.toFixed(3)}, ${row.mine.longitude.toFixed(3)}`
                      : "Not recorded"}
                  </TableCell>
                  <TableCell>
                    {row.dashboard ? <ScoreBar score={row.dashboard.complianceScore} /> : <span className="text-xs text-muted-foreground">Unavailable</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(band === "UNKNOWN" ? "" : band)}>{band}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(row.mine.status)}>{row.mine.status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
