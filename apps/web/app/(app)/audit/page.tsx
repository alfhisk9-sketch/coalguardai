"use client";

import * as React from "react";
import { auditApi, type AuditEntryView } from "../../../lib/api/audit";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDateTime } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

export default function AuditPage() {
  const [query, setQuery] = React.useState("");
  const { data, loading, error, reload } = useAsync<AuditEntryView[]>(async () => (await auditApi.list()).data, []);

  const entries = data ?? [];
  const rows = entries.filter((e) => {
    const q = query.trim().toLowerCase();
    return q === "" || e.action.toLowerCase().includes(q) || e.entityType.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader title="Audit log" description="Immutable record of mutating actions across the platform." />

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            aria-label="Filter audit entries"
            placeholder="Filter by action or entity type"
            className="max-w-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading audit entries…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No audit entries" description="No entries match the current filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="hidden md:table-cell">Entity ID</TableHead>
              <TableHead className="hidden lg:table-cell">Actor</TableHead>
              <TableHead className="hidden sm:table-cell">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e, idx) => (
              <TableRow key={`${e.entityId ?? "none"}-${idx}`}>
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell>
                  <Badge variant="outline">{e.entityType}</Badge>
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{e.entityId?.slice(0, 12) ?? "—"}</TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">{e.actorId.slice(0, 12)}</TableCell>
                <TableCell className="hidden whitespace-nowrap text-xs sm:table-cell">{formatDateTime(e.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
