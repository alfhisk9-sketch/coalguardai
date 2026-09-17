"use client";

import { useAuth } from "../../lib/auth/provider";
import { useAsync } from "../../lib/hooks/use-async";
import { contractorsApi } from "../../lib/api/contractors";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { EmptyState, ErrorState, LoadingState } from "../ui/data-states";
import { KpiCard } from "../common/kpi-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

export function ContractorDashboard() {
  const { ctx } = useAuth();
  const contractorId = ctx?.contractorId ?? null;

  const { data, loading, error, reload } = useAsync(async () => {
    if (!contractorId) return null;
    return (await contractorsApi.listWorkers(contractorId)).data;
  }, [contractorId]);

  if (!contractorId) {
    return (
      <EmptyState
        title="No contractor linked to this account"
        description="Contractor access is granted through a contractor profile link on your user record."
      />
    );
  }
  if (loading) return <LoadingState label="Loading contractor workspace…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const workers = data ?? [];

  return (
    <div className="space-y-5">
      <section aria-label="Key indicators" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Registered workers" value={workers.length} />
        <KpiCard label="Documents" value="—" sublabel="Requires a document list endpoint" />
        <KpiCard label="Expiring soon" value="—" sublabel="Pending backend support" />
        <KpiCard label="Contract status" value="Active" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Workers</CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <EmptyState title="No workers registered" description="Workers registered against your contractor profile appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Worker ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.fullName}</TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{w.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        You are seeing only records linked to your contractor profile. Access is enforced by database row-level
        security, independently of this interface.
      </p>
    </div>
  );
}
