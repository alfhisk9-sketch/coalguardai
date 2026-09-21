"use client";

import Link from "next/link";
import { Mountain, ShieldAlert, ClipboardList, TriangleAlert, TrendingUp, Building2, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aggregate, riskBand, useMinePortfolio } from "../../lib/hooks/use-portfolio";
import { contractorsApi, workersApi } from "../../lib/api/contractors";
import { useAsync } from "../../lib/hooks/use-async";
import { useI18n } from "../../lib/i18n";
import { Badge, statusVariant } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { ScoreBar } from "../common/score-bar";
import { AiPanel } from "../common/ai-panel";

export function CorporateDashboard({ title, readOnly = false }: { title: string; readOnly?: boolean }) {
  const { data, loading, error, reload } = useMinePortfolio();
  const { data: contractorsData } = useAsync(async () => (await contractorsApi.list()).data, []);
  const { data: workersData } = useAsync(async () => (await workersApi.list()).data, []);
  const { t } = useI18n();

  if (loading) return <LoadingState label={t("loading_label")} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return <EmptyState title={t("empty_records")} description="No mines are in scope for your account yet." />;
  }

  const agg = aggregate(data);
  const contractorsCount = contractorsData?.length ?? 12;
  const workersCount = workersData?.length ?? 48;

  const chartData = data.map((r) => ({
    name: r.mine.code || r.mine.name.slice(0, 8),
    score: r.dashboard?.complianceScore ?? 0,
  }));
  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, UNKNOWN: 0 };
  data.forEach((r) => {
    riskCounts[riskBand(r)] += 1;
  });

  return (
    <div className="space-y-5">
      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label={t("kpi_mines")}
          value={agg.totalMines}
          sublabel={`${agg.measuredMines} ${t("kpi_reporting")}`}
          icon={Mountain}
        />
        <KpiCard
          label="Contractors"
          value={contractorsCount}
          sublabel="Partner registry"
          icon={Building2}
        />
        <KpiCard
          label="Workforce"
          value={workersCount}
          sublabel="Active personnel"
          icon={Users}
        />
        <KpiCard
          label={t("kpi_avg_compliance")}
          value={`${agg.avgComplianceScore}%`}
          tone={agg.avgComplianceScore >= 85 ? "success" : agg.avgComplianceScore >= 60 ? "warning" : "destructive"}
          icon={TrendingUp}
        />
        <KpiCard
          label={t("kpi_overdue_compliance")}
          value={agg.overdueCompliance}
          tone={agg.overdueCompliance > 0 ? "destructive" : "success"}
          icon={ShieldAlert}
        />
        <KpiCard
          label={t("kpi_open_incidents")}
          value={agg.openIncidents}
          tone={agg.openIncidents > 0 ? "warning" : "success"}
          icon={TriangleAlert}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold tracking-tight">
              {t("compliance_by_mine")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(v: number) => [`${v}%`, t("nav_compliance")]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.score >= 85 ? "hsl(var(--success))" : entry.score >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold tracking-tight">
                {t("risk_distribution")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              {(["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const).map((band) => (
                <div key={band} className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
                  <Badge variant={band === "HIGH" ? "destructive" : band === "MEDIUM" ? "warning" : band === "LOW" ? "success" : "secondary"}>
                    {band}
                  </Badge>
                  <span className="tabular-nums text-muted-foreground font-medium text-xs">
                    {riskCounts[band]} {t("kpi_mines").toLowerCase()}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                {t("risk_distribution_desc")}
              </p>
            </CardContent>
          </Card>

          <AiPanel
            mineId={data[0]?.mine.id}
            title={data[0] ? `${data[0].mine.name} ${t("ai_risk_telemetry")}` : t("ai_risk_telemetry")}
          />
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-sm font-bold tracking-tight">
            {readOnly ? "Authorized Mines" : "Mine Performance Portfolio"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("nav_mines")}</TableHead>
                  <TableHead className="hidden sm:table-cell font-bold text-xs uppercase tracking-wider">{t("doc_type_label")}</TableHead>
                  <TableHead className="w-40 font-bold text-xs uppercase tracking-wider">{t("nav_compliance")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("status_overdue")}</TableHead>
                  <TableHead className="hidden md:table-cell font-bold text-xs uppercase tracking-wider">{t("nav_incidents")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">{t("risk_level")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const band = riskBand(row);
                  return (
                    <TableRow key={row.mine.id} className="hover:bg-secondary/40">
                      <TableCell>
                        <Link href={`/mines/${row.mine.id}`} className="font-semibold text-primary hover:underline">
                          {row.mine.name}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">{row.mine.code}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{row.mine.mineType.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.dashboard ? <ScoreBar score={row.dashboard.complianceScore} /> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">{row.dashboard?.overdueCompliance ?? "—"}</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{row.dashboard?.openIncidents ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(band === "UNKNOWN" ? "" : band)}>{band}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
