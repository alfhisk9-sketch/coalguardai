"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Building2, CheckCircle2, AlertOctagon, Mountain, X, ArrowRight, ShieldCheck, AlertTriangle, ClipboardList, Phone, Mail, ExternalLink } from "lucide-react";
import { contractorsApi, type EnrichedContractor, type ContractorDetail } from "../../../lib/api/contractors";
import { minesApi } from "../../../lib/api/mines";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import type { Mine } from "@sih/types";

export default function ContractorsPage() {
  const [selectedMine, setSelectedMine] = React.useState("ALL");
  const [selectedService, setSelectedService] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [activeContractorId, setActiveContractorId] = React.useState<string | null>(null);

  // Load mines for filter dropdown
  const { data: mines } = useAsync<Mine[]>(async () => (await minesApi.list()).data, []);

  // Fetch contractors from API
  const { data: contractorsData, loading, error, reload } = useAsync<EnrichedContractor[]>(
    async () => (await contractorsApi.list(selectedMine)).data,
    [selectedMine]
  );

  // Fetch contractor details when one is clicked
  const { data: detailData, loading: detailLoading } = useAsync<ContractorDetail | null>(
    async () => {
      if (!activeContractorId) return null;
      return (await contractorsApi.get(activeContractorId)).data;
    },
    [activeContractorId]
  );

  const contractors = contractorsData ?? [];

  // Determine unique service types for filter
  const serviceTypes = React.useMemo(() => {
    const set = new Set<string>();
    contractors.forEach((c) => {
      if (c.services) {
        c.services.split(",").forEach((s) => set.add(s.trim()));
      }
    });
    return Array.from(set);
  }, [contractors]);

  // Client filtering
  const rows = contractors.filter((c) => {
    const q = query.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      c.companyName.toLowerCase().includes(q) ||
      (c.contractorId && c.contractorId.toLowerCase().includes(q)) ||
      (c.primaryMineName && c.primaryMineName.toLowerCase().includes(q));

    const matchesService =
      selectedService === "ALL" ||
      (c.services && c.services.toLowerCase().includes(selectedService.toLowerCase()));

    const matchesStatus = selectedStatus === "ALL" || c.status === selectedStatus;

    return matchesSearch && matchesService && matchesStatus;
  });

  const totalContractors = contractors.length;
  const activeCount = contractors.filter((c) => c.status === "ACTIVE").length;
  const suspendedCount = contractors.filter((c) => c.status === "SUSPENDED").length;
  const minesCovered = new Set(contractors.map((c) => c.mineId)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractors"
        description="Organizations engaged across CoalGuard mining operations."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Total Contractors"
          value={totalContractors}
          icon={Building2}
        />
        <KpiCard
          label="Active"
          value={activeCount}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Suspended"
          value={suspendedCount}
          tone={suspendedCount > 0 ? "destructive" : "default"}
          icon={AlertOctagon}
        />
        <KpiCard
          label="Mines Covered"
          value={minesCovered}
          icon={Mountain}
        />
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search contractor"
              placeholder="Search contractor by name or ID…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select
            aria-label="Filter by Mine"
            value={selectedMine}
            onChange={(e) => setSelectedMine(e.target.value)}
          >
            <option value="ALL">All Mines</option>
            {(mines ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by Service Type"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
          >
            <option value="ALL">All Service Types</option>
            {serviceTypes.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <LoadingState label="Loading contractors…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No contractors found" description="No contractors match the current filter selection." />
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Contractor</TableHead>
                <TableHead>Contractor ID</TableHead>
                <TableHead className="hidden md:table-cell">Primary Mine</TableHead>
                <TableHead className="hidden lg:table-cell">Services</TableHead>
                <TableHead className="text-center">Workers</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveContractorId(c.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {c.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground hover:text-primary transition-colors">
                        {c.companyName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {c.contractorId || c.registrationNo || c.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground font-medium">
                    {c.primaryMineName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-foreground/80 max-w-xs truncate">
                    {c.services}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {c.workerCount ?? 4}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Contractor Detail Slideover Panel */}
      {activeContractorId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-xl bg-card border-l border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            {detailLoading || !detailData ? (
              <LoadingState label="Loading contractor profile…" />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary font-bold flex items-center justify-center text-lg">
                      {detailData.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{detailData.companyName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-semibold text-primary">{detailData.contractorId}</span>
                        <Badge variant={statusVariant(detailData.status)}>{detailData.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveContractorId(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                    <span className="text-xs text-muted-foreground block">Total Workers</span>
                    <span className="text-xl font-bold mt-1 block">{detailData.workerCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                    <span className="text-xs text-muted-foreground block">Active Staff</span>
                    <span className="text-xl font-bold text-emerald-600 mt-1 block">{detailData.activeWorkers}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                    <span className="text-xs text-muted-foreground block">Safety Compliance</span>
                    <span className="text-xl font-bold text-primary mt-1 block">{detailData.safetyComplianceScore}%</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                    <span className="text-xs text-muted-foreground block">Open Incidents</span>
                    <span className="text-xl font-bold text-amber-500 mt-1 block">{detailData.openIncidentsCount}</span>
                  </div>
                </div>

                {/* Information and Contact */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contractor Information</h4>
                  <div className="rounded-lg bg-muted/30 p-4 border border-border/60 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scope of Services:</span>
                      <span className="font-medium text-right max-w-xs">{detailData.services}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operations Contact:</span>
                      <span className="font-medium">{detailData.contactName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email:</span>
                      <span className="font-mono text-xs">{detailData.contactEmail}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone:</span>
                      <span className="font-mono text-xs">{detailData.contactPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Mines */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Mines</h4>
                  <div className="space-y-2">
                    {detailData.assignedMines?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60 text-sm">
                        <span className="font-medium flex items-center gap-2">
                          <Mountain className="h-4 w-4 text-primary" /> {m.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{m.code}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registered Workers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Workers</h4>
                    <span className="text-xs text-muted-foreground">{detailData.workers?.length} workers</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {detailData.workers?.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs">
                        <div>
                          <span className="font-semibold block text-sm">{w.fullName}</span>
                          <span className="text-muted-foreground font-mono">{w.workerId} • {w.role}</span>
                        </div>
                        <Badge variant={w.trainingStatus === "VALID" ? "success" : "destructive"}>
                          {w.shift}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance & Inspections Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Inspections & CAPA</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                      <span className="font-semibold flex items-center gap-1 text-primary mb-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Inspections
                      </span>
                      <p className="text-muted-foreground">
                        {detailData.recentInspections?.length ? `${detailData.recentInspections.length} recorded at mine` : "Routine checks compliant"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                      <span className="font-semibold flex items-center gap-1 text-amber-500 mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Pending CAPA
                      </span>
                      <p className="text-muted-foreground">
                        {detailData.pendingCapaCount === 0 ? "All remediation verified" : `${detailData.pendingCapaCount} action pending`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Profile Link */}
                <div className="pt-4 border-t border-border flex gap-3">
                  <Link
                    href={`/contractors/${detailData.id}`}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    View Full Profile <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setActiveContractorId(null)}
                    className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
