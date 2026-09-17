"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { aggregate, riskBand, useMinePortfolio } from "../../lib/hooks/use-portfolio";
import { Badge, statusVariant } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { ScoreBar } from "../common/score-bar";
import { AiPanel } from "../common/ai-panel";

export function CorporateDashboard({ title, readOnly = false }: { title: string; readOnly?: boolean }) {
  const { data, loading, error, reload } = useMinePortfolio();

  if (loading) return <LoadingState label="Loading portfolio…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return <EmptyState title="No mines available" description="No mines are in scope for your account yet." />;
  }

  const agg = aggregate(data);
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
      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Mines" value={agg.totalMines} sublabel={`${agg.measuredMines} reporting`} />
        <KpiCard
          label="Avg compliance"
          value={`${agg.avgComplianceScore}%`}
          tone={agg.avgComplianceScore >= 85 ? "success" : agg.avgComplianceScore >= 60 ? "warning" : "destructive"}
        />
        <KpiCard label="Overdue compliance" value={agg.overdueCompliance} tone={agg.overdueCompliance > 0 ? "destructive" : "success"} />
        <KpiCard label="Open inspections" value={agg.openInspections} />
        <KpiCard label="Open incidents" value={agg.openIncidents} tone={agg.openIncidents > 0 ? "warning" : "success"} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Compliance score by mine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(v: number) => [`${v}%`, "Compliance"]}
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
          <Card>
            <CardHeader>
              <CardTitle>Risk distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["HIGH", "MEDIUM", "LOW", "UNKNOWN"] as const).map((band) => (
                <div key={band} className="flex items-center justify-between text-sm">
                  <Badge variant={band === "HIGH" ? "destructive" : band === "MEDIUM" ? "warning" : band === "LOW" ? "success" : "secondary"}>
                    {band}
                  </Badge>
                  <span className="tabular-nums text-muted-foreground">{riskCounts[band]} mines</span>
                </div>
              ))}
              <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                Banding is derived in the interface from compliance score, overdue items and open incidents. It is not
                an official regulatory rating.
              </p>
            </CardContent>
          </Card>
          <AiPanel
            mineId={data[0]?.mine.id}
            title={data[0] ? `${data[0].mine.name} AI Risk & Anomaly Telemetry` : "AI Risk Telemetry"}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{readOnly ? "Authorized mines" : "Mine performance"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mine</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="w-40">Compliance</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead className="hidden md:table-cell">Incidents</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
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
                    <TableCell>
                      {row.dashboard ? <ScoreBar score={row.dashboard.complianceScore} /> : <span className="text-xs text-muted-foreground">Unavailable</span>}
                    </TableCell>
                    <TableCell className="tabular-nums">{row.dashboard?.overdueCompliance ?? "—"}</TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{row.dashboard?.openIncidents ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(band === "UNKNOWN" ? "" : band)}>{band}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
