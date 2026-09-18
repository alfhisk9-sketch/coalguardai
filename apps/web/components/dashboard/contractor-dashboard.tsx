"use client";

import { Users, FileText, Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import { useAsync } from "../../lib/hooks/use-async";
import { contractorsApi } from "../../lib/api/contractors";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";

export function ContractorDashboard() {
  const { ctx } = useAuth();
  const { t } = useI18n();
  const contractorId = ctx?.contractorId ?? null;

  const { data, loading, error, reload } = useAsync(async () => {
    if (!contractorId) return null;
    return (await contractorsApi.listWorkers(contractorId)).data;
  }, [contractorId]);

  if (!contractorId) {
    return (
      <EmptyState
        title={t("no_contractor_linked")}
        description={t("no_contractor_linked_desc")}
      />
    );
  }
  if (loading) return <LoadingState label={t("loading_label")} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const workers = data ?? [];

  return (
    <div className="space-y-5">
      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("registered_workers")}
          value={workers.length}
          icon={Users}
          tone="default"
        />
        <KpiCard
          label={t("documents")}
          value="4"
          sublabel="Statutory compliance & permits"
          icon={FileText}
          tone="success"
        />
        <KpiCard
          label={t("expiring_soon")}
          value="1"
          sublabel="Insurance renewal due in 15d"
          icon={Clock}
          tone="warning"
        />
        <KpiCard
          label={t("contract_status")}
          value={t("status_active")}
          icon={ShieldCheck}
          tone="success"
          status="DGMS Verified"
        />
      </section>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold tracking-tight">
              {t("workers")}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {workers.length} {t("registered_workers")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {workers.length === 0 ? (
            <EmptyState
              title={t("no_workers_registered")}
              description={t("workers_registered_desc")}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">
                      {t("worker_name")}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-bold text-xs uppercase tracking-wider">
                      {t("worker_id")}
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">
                      {t("status_label")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((w) => (
                    <TableRow key={w.id} className="hover:bg-secondary/40">
                      <TableCell className="font-semibold text-foreground">
                        {w.fullName}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {w.id}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          {t("status_active")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t("contractor_rls_notice")}
      </p>
    </div>
  );
}
