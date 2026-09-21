"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MapPin, ShieldAlert, CheckCircle2, Clock, Map, Eye, Calendar, AlertTriangle } from "lucide-react";
import { riskBand, useMinePortfolio } from "../../../lib/hooks/use-portfolio";
import { PageHeader } from "../../../components/common/page-header";
import { ScoreBar } from "../../../components/common/score-bar";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

export default function MinesPage() {
  const { data, loading, error, reload } = useMinePortfolio();
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("ALL");
  const [risk, setRisk] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");

  const mines = data ?? [];

  // Top KPI calculations
  const totalMines = mines.length;
  const activeMines = mines.filter((m) => m.mine.status === "ACTIVE").length;
  const highRiskMines = mines.filter((m) => {
    const b = riskBand(m);
    return b === "HIGH";
  }).length;
  const underInspectionMines = mines.filter((m) => {
    const score = m.dashboard?.complianceScore ?? 100;
    return score < 80 || m.mine.status === "INACTIVE";
  }).length;
  const compliantMines = mines.filter((m) => {
    const score = m.dashboard?.complianceScore ?? 100;
    return score >= 85;
  }).length;

  const rows = mines.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = q === "" || r.mine.name.toLowerCase().includes(q) || r.mine.code.toLowerCase().includes(q);
    const matchesType = type === "ALL" || r.mine.mineType === type;
    const matchesRisk = risk === "ALL" || riskBand(r) === risk;
    const matchesStatus = status === "ALL" || r.mine.status === status;
    return matchesQuery && matchesType && matchesRisk && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Mines Directory"
          description="Enterprise mining inventory across Indian coal basins with real-time compliance and risk posture."
        />
        <Link href="/map">
          <Button variant="outline" className="flex items-center gap-2 shrink-0">
            <Map className="h-4 w-4 text-primary" />
            <span>View on GIS Map</span>
          </Button>
        </Link>
      </div>

      {/* Top Enterprise KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-border shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Mines</span>
              <MapPin className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-foreground">{totalMines}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Authorised portfolio</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Operations</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeMines}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Producing sites</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">High / Crit Risk</span>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-destructive">{highRiskMines}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Requires audit</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Attention Needed</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{underInspectionMines}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sub-80% score</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Fully Compliant</span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1.5 text-2xl font-extrabold text-primary">{compliantMines}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">&gt;85% compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-3 p-3.5 sm:grid-cols-4">
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search mines"
              placeholder="Search by name or code..."
              className="pl-8 text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select aria-label="Filter by mine type" value={type} onChange={(e) => setType(e.target.value)} className="text-xs">
            <option value="ALL">All mine types</option>
            <option value="OPEN_CAST">Open Cast</option>
            <option value="UNDERGROUND">Underground</option>
            <option value="MIXED">Mixed</option>
          </Select>
          <Select aria-label="Filter by risk band" value={risk} onChange={(e) => setRisk(e.target.value)} className="text-xs">
            <option value="ALL">All risk bands</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </Select>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs">
            <option value="ALL">All operational statuses</option>
            <option value="ACTIVE">Active Operations</option>
            <option value="INACTIVE">Inactive / Standby</option>
          </Select>
        </CardContent>
      </Card>

      {/* Content: Table for Desktop, Cards for Mobile */}
      {loading ? (
        <LoadingState label="Loading comprehensive mines inventory…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No mines match these filters" description="Adjust your search query or filter selections." />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40">
                  <TableHead className="font-bold">Mine & Code</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Geographic Basin</TableHead>
                  <TableHead className="w-36 font-bold">Compliance</TableHead>
                  <TableHead className="font-bold">Risk Posture</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const band = riskBand(row);
                  const score = row.dashboard?.complianceScore ?? 85;
                  return (
                    <TableRow key={row.mine.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <Link href={`/mines/${row.mine.id}`} className="font-bold text-foreground hover:text-primary transition-colors">
                          {row.mine.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{row.mine.code}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {row.mine.mineType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.mine.latitude !== null && row.mine.longitude !== null ? (
                          <span title={`${row.mine.latitude}, ${row.mine.longitude}`}>
                            {row.mine.latitude.toFixed(2)}°N, {row.mine.longitude.toFixed(2)}°E
                          </span>
                        ) : (
                          "Regional Basin"
                        )}
                      </TableCell>
                      <TableCell>
                        <ScoreBar score={score} />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            band === "HIGH"
                              ? "destructive"
                              : band === "MEDIUM"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {band}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.mine.status)} className="text-[10px]">
                          {row.mine.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/mines/${row.mine.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium" title="View Mine Dashboard">
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                          </Link>
                          <Link href={`/inspections?mineId=${row.mine.id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-medium" title="Inspect Mine">
                              <Calendar className="h-3.5 w-3.5 mr-1" /> Inspect
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-3 md:hidden">
            {rows.map((row) => {
              const band = riskBand(row);
              const score = row.dashboard?.complianceScore ?? 85;
              return (
                <Card key={row.mine.id} className="border-border shadow-sm p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/mines/${row.mine.id}`} className="font-bold text-sm text-foreground hover:text-primary">
                        {row.mine.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{row.mine.code}</p>
                    </div>
                    <Badge variant={statusVariant(row.mine.status)} className="text-[10px]">
                      {row.mine.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Type: {row.mine.mineType.replace("_", " ")}</span>
                    <Badge
                      variant={
                        band === "HIGH"
                          ? "destructive"
                          : band === "MEDIUM"
                          ? "warning"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {band} RISK
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <ScoreBar score={score} />
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Link href={`/mines/${row.mine.id}`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full h-8 text-xs font-semibold">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/map`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs font-semibold">
                        Locate on Map
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
