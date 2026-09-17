"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mockApi, type MockProductionReport } from "../../../lib/api/mock";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDate } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

/** DEMO DATA. /api/production/reports is POST-only in C1. */
export default function ProductionPage() {
  const { data, loading, error, reload } = useAsync<MockProductionReport[]>(() => mockApi.listProductionReports(), []);

  if (loading) return <LoadingState label="Loading production reports…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const reports = data ?? [];
  if (reports.length === 0) return <EmptyState title="No production reports" />;

  const chartData = reports.map((r) => ({
    period: formatDate(r.periodStart).slice(3),
    Target: r.targetQuantity,
    Actual: r.actualQuantity,
    Variance: Math.round(((r.actualQuantity - r.targetQuantity) / r.targetQuantity) * 100),
  }));
  const totalTarget = reports.reduce((a, r) => a + r.targetQuantity, 0);
  const totalActual = reports.reduce((a, r) => a + r.actualQuantity, 0);
  const variance = Math.round(((totalActual - totalTarget) / totalTarget) * 100);

  return (
    <>
      <PageHeader title="Production" description="Target versus actual output by reporting period." demo />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Periods" value={reports.length} />
        <KpiCard label="Total target" value={totalTarget.toLocaleString("en-IN")} sublabel="tonnes" />
        <KpiCard label="Total actual" value={totalActual.toLocaleString("en-IN")} sublabel="tonnes" />
        <KpiCard label="Variance" value={`${variance > 0 ? "+" : ""}${variance}%`} tone={variance >= 0 ? "success" : "destructive"} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Target vs actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Target" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Actual" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variance trend (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Line type="monotone" dataKey="Variance" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="hidden md:table-cell">Mine</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Actual</TableHead>
            <TableHead>Variance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => {
            const v = Math.round(((r.actualQuantity - r.targetQuantity) / r.targetQuantity) * 100);
            return (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{r.mineName}</TableCell>
                <TableCell className="tabular-nums">{r.targetQuantity.toLocaleString("en-IN")}</TableCell>
                <TableCell className="tabular-nums">{r.actualQuantity.toLocaleString("en-IN")}</TableCell>
                <TableCell className={v >= 0 ? "text-success" : "text-destructive"}>
                  {v > 0 ? "+" : ""}{v}%
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <p className="mt-4 text-xs text-muted-foreground">
        Operational output figures shown here are fictional demonstration data, not reported production.
      </p>
    </>
  );
}
