"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Building2, Mountain, Mail, Phone, ShieldCheck, AlertTriangle, Users, FileText, CheckCircle2 } from "lucide-react";
import { contractorsApi, type ContractorDetail } from "../../../../lib/api/contractors";
import { useAsync } from "../../../../lib/hooks/use-async";
import { PageHeader } from "../../../../components/common/page-header";
import { KpiCard } from "../../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../../components/ui/data-states";

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const contractorId = params.id;

  const { data: contractor, loading, error, reload } = useAsync<ContractorDetail>(
    async () => (await contractorsApi.get(contractorId)).data,
    [contractorId]
  );

  if (loading) return <LoadingState label="Loading contractor profile…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!contractor) return <EmptyState title="Contractor not found" />;

  const friendlyId = contractor.contractorId || contractor.registrationNo || "CTR-DEMO-001";
  const workers = contractor.workers ?? [];
  const documents = contractor.documents ?? [];
  const assignedMines = contractor.assignedMines ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/contractors" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Contractors
        </Link>
      </div>

      <PageHeader
        title={contractor.companyName}
        description={`Identifier: ${friendlyId} • Active Partner across CoalGuard Mining Operations`}
        actions={
          <Badge variant={statusVariant(contractor.status)} className="px-3 py-1 text-xs">
            {contractor.status}
          </Badge>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Workforce Registered"
          value={workers.length}
          icon={Users}
        />
        <KpiCard
          label="Safety Compliance"
          value={`${contractor.safetyComplianceScore ?? 94}%`}
          tone="success"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Statutory Documents"
          value={documents.length}
          icon={FileText}
        />
        <KpiCard
          label="Open Incidents"
          value={contractor.openIncidentsCount ?? 0}
          tone={(contractor.openIncidentsCount ?? 0) > 0 ? "warning" : "success"}
          icon={AlertTriangle}
        />
      </div>

      {/* Organization and Scope Information */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">System Contractor ID</span>
              <span className="font-mono font-semibold text-primary">{friendlyId}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Primary Mine Deployment</span>
              <span className="font-semibold">{contractor.primaryMine?.name || contractor.primaryMineName}</span>
              <span className="text-xs text-muted-foreground block font-mono mt-0.5">
                {contractor.primaryMine?.code || contractor.primaryMineCode}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Services Scope</span>
              <span className="font-medium text-foreground/90">{contractor.services}</span>
            </div>
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-xs text-muted-foreground block uppercase tracking-wider font-semibold">
                Authorized Contact
              </span>
              <div className="flex items-center gap-2 text-sm font-medium">
                {contractor.contactName}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {contractor.contactEmail}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {contractor.contactPhone}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Mines and Deployments */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mountain className="h-4 w-4 text-primary" /> Operational Deployments & Assigned Mines
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {assignedMines.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm block">{m.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{m.code}</span>
                    </div>
                    <Badge variant="success">Active Deployment</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Registered Workforce Table */}
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Registered Workforce ({workers.length})
              </CardTitle>
              <Link href="/workers" className="text-xs font-semibold text-primary hover:underline">
                View All Workers →
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {workers.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No registered workers" description="Workers enrolled under this contractor will appear here." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Worker</TableHead>
                      <TableHead>Worker ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-semibold text-sm">{w.fullName}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{w.workerId}</TableCell>
                        <TableCell className="text-sm">{w.role}</TableCell>
                        <TableCell className="text-xs">{w.shift}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(w.status || "ACTIVE")}>{w.status || "ACTIVE"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
