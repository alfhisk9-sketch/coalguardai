"use client";

import * as React from "react";
import { grievanceCreateSchema } from "@sih/validation";
import { mockApi, type MockGrievance } from "../../../lib/api/mock";
import { useAsync } from "../../../lib/hooks/use-async";
import { apiPost } from "../../../lib/api/client";
import { ApiRequestError } from "../../../lib/api/client";
import { formatDateTime } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { MinePicker } from "../../../components/common/mine-picker";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

/**
 * Submission is REAL (POST /api/grievances exists). The list is DEMO DATA — C1 has no
 * GET route for grievances. Both facts are surfaced in the UI.
 */
export default function GrievancesPage() {
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Safety");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [description, setDescription] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const { data, loading, error, reload } = useAsync<MockGrievance[]>(() => mockApi.listGrievances(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setServerError(null);
    setNotice(null);

    const parsed = grievanceCreateSchema.safeParse({
      mineId: mineId ?? "",
      title,
      category,
      priority,
      ...(description ? { description } : {}),
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/grievances", parsed.data);
      setNotice("Grievance submitted. It is visible only to you, the assignee, and mine management.");
      setTitle("");
      setDescription("");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Unable to submit this grievance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Grievances"
        description="Confidential workforce grievances, routed to mine management."
        actions={<MinePicker value={mineId} onChange={setMineId} />}
      />

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submit a grievance</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-title">Title</Label>
                <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                {fieldErrors.title ? <p className="text-xs text-destructive">{fieldErrors.title.join(", ")}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-category">Category</Label>
                <Select id="g-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {["Safety", "Welfare", "Wages", "Working hours", "Other"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-priority">Priority</Label>
                <Select id="g-priority" value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
                  {["LOW", "MEDIUM", "HIGH"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-desc">Description</Label>
                <textarea
                  id="g-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {fieldErrors.description ? <p className="text-xs text-destructive">{fieldErrors.description.join(", ")}</p> : null}
              </div>
              {notice ? <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-xs text-success">{notice}</p> : null}
              {serverError ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{serverError}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting || !mineId}>
                {submitting ? "Submitting…" : "Submit grievance"}
              </Button>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Grievances are stored as confidential. Visibility is restricted server-side to the submitter, the
                assignee and mine management, independently of this interface.
              </p>
            </form>
          </CardContent>
        </Card>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-semibold">Recent grievances</h2>
            <Badge variant="warning">Demo data</Badge>
          </div>
          {loading ? (
            <LoadingState label="Loading grievances…" />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (data ?? []).length === 0 ? (
            <EmptyState title="No grievances" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <p className="font-medium">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(g.submittedAt)}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{g.category}</TableCell>
                    <TableCell className="hidden text-xs lg:table-cell">{g.assignedTo ?? "Unassigned"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(g.priority)}>{g.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(g.status)}>{g.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
