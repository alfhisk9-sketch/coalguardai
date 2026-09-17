"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { ROLE_KEYS, PERMISSION_KEYS, ROLE_PERMISSION_MATRIX } from "@sih/config";
import type { RoleKey } from "@sih/config";
import { minesApi } from "../../../lib/api/mines";
import { auditApi } from "../../../lib/api/audit";
import { useAsync } from "../../../lib/hooks/use-async";
import { useAuth } from "../../../lib/auth/provider";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import { cn } from "../../../lib/utils";

const TABS = ["Overview", "Roles & permissions", "Mines"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const { can } = useAuth();
  const [tab, setTab] = React.useState<Tab>("Overview");

  const { data, loading, error, reload } = useAsync(async () => {
    const mines = (await minesApi.list()).data;
    let auditCount: number | null = null;
    try {
      auditCount = (await auditApi.list()).data.length;
    } catch {
      auditCount = null;
    }
    return { mines, auditCount };
  }, []);

  // UX-only gate. The backend rejects unauthorized calls regardless of what renders here.
  if (!can("users.manage")) {
    return (
      <>
        <PageHeader title="Administration" />
        <EmptyState
          title="Not available for your role"
          description="Administration requires the users.manage permission. This screen is hidden as a convenience — access is enforced by the database and API, not by this check."
        />
      </>
    );
  }

  if (loading) return <LoadingState label="Loading administration…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const mines = data?.mines ?? [];

  return (
    <>
      <PageHeader title="Administration" description="Organisation configuration, role model and system overview." />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Mines" value={mines.length} />
        <KpiCard label="Roles" value={ROLE_KEYS.length} />
        <KpiCard label="Permissions" value={PERMISSION_KEYS.length} />
        <KpiCard label="Audit entries" value={data?.auditCount ?? "—"} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Administration sections">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <Card>
          <CardHeader>
            <CardTitle>User management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <p className="leading-relaxed text-muted-foreground">
                <strong className="text-foreground">User CRUD: NOT IMPLEMENTED.</strong> The backend exposes no
                users or role-assignment endpoints (<code>user_roles</code> is managed directly in the database).
                Building a frontend that appeared to create users or grant roles would be misleading, and any
                frontend-only role change would be rejected by row-level security anyway. Role assignment is
                currently a database operation.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "Roles & permissions" ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-secondary/60">Permission</TableHead>
                {ROLE_KEYS.map((r) => (
                  <TableHead key={r} className="whitespace-nowrap text-center">{r.replace(/_/g, " ")}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_KEYS.map((perm) => (
                <TableRow key={perm}>
                  <TableCell className="sticky left-0 bg-card font-mono text-xs">{perm}</TableCell>
                  {ROLE_KEYS.map((role: RoleKey) => (
                    <TableCell key={role} className="text-center">
                      {ROLE_PERMISSION_MATRIX[role].includes(perm) ? (
                        <span className="text-success" aria-label="granted">✓</span>
                      ) : (
                        <span className="text-muted-foreground" aria-label="not granted">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Read-only view of the role model defined in the shared config package and mirrored by the database seed.
            Editing it here is deliberately not offered — it is a schema-level concern.
          </p>
        </div>
      ) : null}

      {tab === "Mines" ? (
        mines.length === 0 ? (
          <EmptyState title="No mines" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mine</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell className="hidden sm:table-cell">{m.mineType.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : null}
    </>
  );
}
