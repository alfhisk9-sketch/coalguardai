"use client";

import * as React from "react";
import { Search, Users, UserCheck, UserX, Building2, AlertTriangle, X, Shield, Calendar, HeartPulse } from "lucide-react";
import { workersApi, type Worker, contractorsApi, type EnrichedContractor } from "../../../lib/api/contractors";
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

export default function WorkersPage() {
  const [selectedMine, setSelectedMine] = React.useState("ALL");
  const [selectedContractor, setSelectedContractor] = React.useState("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [selectedShift, setSelectedShift] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [query, setQuery] = React.useState("");
  const [activeWorker, setActiveWorker] = React.useState<Worker | null>(null);

  // Load mines & contractors for filter dropdowns
  const { data: mines } = useAsync<Mine[]>(async () => (await minesApi.list()).data, []);
  const { data: contractors } = useAsync<EnrichedContractor[]>(async () => (await contractorsApi.list()).data, []);

  // Fetch workers from live API
  const { data: workersData, loading, error, reload } = useAsync<Worker[]>(
    async () =>
      (
        await workersApi.list({
          mineId: selectedMine,
          contractorId: selectedContractor,
          category: selectedCategory,
          shift: selectedShift,
          status: selectedStatus,
          query: query.trim() || undefined,
        })
      ).data,
    [selectedMine, selectedContractor, selectedCategory, selectedShift, selectedStatus, query]
  );

  const workers = workersData ?? [];
  const meta = {
    total: workers.length,
    active: workers.filter((w) => w.status === "ACTIVE").length,
    inactive: workers.filter((w) => w.status === "INACTIVE").length,
    contractorsCount: new Set(workers.map((w) => w.contractorId)).size,
    trainingDueCount: workers.filter((w) => w.trainingStatus === "DUE").length,
  };

  const categories = React.useMemo(() => {
    return Array.from(new Set(workers.map((w) => w.category).filter(Boolean)));
  }, [workers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        description="Contractor workforce registered across CoalGuard mines."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Workers"
          value={meta.total}
          icon={Users}
        />
        <KpiCard
          label="Active Workers"
          value={meta.active}
          tone="success"
          icon={UserCheck}
        />
        <KpiCard
          label="Inactive Workers"
          value={meta.inactive}
          tone={meta.inactive > 0 ? "warning" : "default"}
          icon={UserX}
        />
        <KpiCard
          label="Contractors"
          value={meta.contractorsCount}
          icon={Building2}
        />
        <KpiCard
          label="Training Due"
          value={meta.trainingDueCount}
          tone={meta.trainingDueCount > 0 ? "destructive" : "success"}
          icon={AlertTriangle}
        />
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search worker"
              placeholder="Search worker by name, ID or role…"
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
            aria-label="Filter by Contractor"
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
          >
            <option value="ALL">All Contractors</option>
            {(contractors ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by Shift"
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
          >
            <option value="ALL">All Shifts</option>
            <option value="Shift A">Shift A (Morning)</option>
            <option value="Shift B">Shift B (Evening)</option>
            <option value="Shift C">Shift C (Night)</option>
          </Select>

          <Select
            aria-label="Filter by Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </CardContent>
      </Card>

      {/* Workers Table */}
      {loading ? (
        <LoadingState label="Loading workforce records…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : workers.length === 0 ? (
        <EmptyState title="No workers found" description="No registered workers match the selected criteria." />
      ) : (
        <Card className="border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Worker</TableHead>
                <TableHead>Worker ID</TableHead>
                <TableHead className="hidden md:table-cell">Contractor</TableHead>
                <TableHead className="hidden lg:table-cell">Mine</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden xl:table-cell">Shift</TableHead>
                <TableHead>Training</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((w) => (
                <TableRow
                  key={w.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveWorker(w)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                        {w.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground hover:text-primary transition-colors">
                        {w.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {w.workerId || "WRK-DEMO"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-foreground/90 font-medium">
                    {w.contractorName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {w.mineName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {w.role}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border/70">
                      {w.shift}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.trainingStatus === "VALID" ? "success" : "destructive"}>
                      {w.trainingStatus === "VALID" ? "Certified" : "Due Soon"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(w.status || "ACTIVE")}>
                      {w.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Worker Detail Slideover */}
      {activeWorker && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md bg-card border-l border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-lg">
                    {activeWorker.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{activeWorker.fullName}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{activeWorker.workerId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWorker(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground block">Current Status</span>
                  <Badge variant={statusVariant(activeWorker.status || "ACTIVE")} className="mt-1">
                    {activeWorker.status}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground block">Assigned Shift</span>
                  <span className="font-medium text-sm block mt-1">{activeWorker.shift}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organizational Assignment</h4>
                <div className="space-y-2 rounded-lg bg-muted/30 p-3 border border-border/60 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contractor:</span>
                    <span className="font-medium text-right">{activeWorker.contractorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary Mine:</span>
                    <span className="font-medium text-right">{activeWorker.mineName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role Designation:</span>
                    <span className="font-medium text-right">{activeWorker.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium text-right">{activeWorker.category}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance & Medical</h4>
                <div className="space-y-2 rounded-lg bg-muted/30 p-3 border border-border/60 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary" /> Safety Training
                    </span>
                    <Badge variant={activeWorker.trainingStatus === "VALID" ? "success" : "destructive"}>
                      {activeWorker.trainingStatus === "VALID" ? "Valid / Certified" : "Refresher Due"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <HeartPulse className="h-4 w-4 text-emerald-500" /> Medical Fitness
                    </span>
                    <span className="font-medium">{activeWorker.lastMedicalCheck || "2026-02-18"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-blue-500" /> Joining Date
                    </span>
                    <span className="font-medium">{activeWorker.joiningDate || "2024-03-15"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <button
                onClick={() => setActiveWorker(null)}
                className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
