"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { contractorsApi, type Worker } from "../../../../lib/api/contractors";
import { documentsApi, type DocumentView } from "../../../../lib/api/documents";
import { useAsync } from "../../../../lib/hooks/use-async";
import { PageHeader } from "../../../../components/common/page-header";
import { KpiCard } from "../../../../components/common/kpi-card";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../../components/ui/data-states";

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const contractorId = params.id;

  const { data, loading, error, reload } = useAsync(async () => {
    const workers = (await contractorsApi.listWorkers(contractorId)).data;
    let documents: DocumentView[] = [];
    let documentsAvailable = true;
    try {
      documents = (await documentsApi.listForOwner("CONTRACTOR", contractorId)).data;
    } catch {
      documentsAvailable = false;
    }
    return { workers, documents, documentsAvailable };
  }, [contractorId]);

  if (loading) return <LoadingState label="Loading contractor…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <EmptyState title="Contractor not found" />;

  const { workers, documents, documentsAvailable } = data;

  return (
    <>
      <PageHeader title="Contractor profile" description={`Record ${contractorId.slice(0, 12)} — workforce and document compliance.`} />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Workers" value={workers.length} />
        <KpiCard label="Documents" value={documentsAvailable ? documents.length : "—"} sublabel={documentsAvailable ? undefined : "Document list unavailable"} />
        <KpiCard label="Compliance score" value="—" sublabel="No contractor compliance endpoint" />
        <KpiCard label="Expiring soon" value="—" sublabel="No expiry field in the contract" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workers</CardTitle>
          </CardHeader>
          <CardContent>
            {workers.length === 0 ? (
              <EmptyState title="No workers registered" description="Workers linked to this contractor appear here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Worker ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((w: Worker) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.fullName}</TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">{w.id.slice(0, 12)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!documentsAvailable ? (
              <p className="text-xs text-muted-foreground">
                Documents could not be loaded for this contractor. This usually means no documents are registered
                against it, or your role does not permit document access.
              </p>
            ) : documents.length === 0 ? (
              <EmptyState title="No documents" description="Registered contractor documents appear here." />
            ) : (
              documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.fileName}</p>
                    <p className="text-xs text-muted-foreground">{d.mimeType}</p>
                  </div>
                  <Badge variant="outline">{d.ownerType}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Contractor compliance scoring and document expiry tracking are not part of the current backend contract. Those
        KPIs show a dash rather than an estimated figure.
      </p>
    </>
  );
}
