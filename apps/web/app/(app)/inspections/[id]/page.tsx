"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { observationCreateSchema } from "@sih/validation";
import type { InspectionObservation } from "@sih/types";
import { observationsApi } from "../../../../lib/api/observations";
import { useAsync } from "../../../../lib/hooks/use-async";
import { inspectionsApi } from "../../../../lib/api/inspections";
import { useGeolocation } from "../../../../lib/hooks/use-geolocation";
import { useAuth } from "../../../../lib/auth/provider";
import { ApiRequestError } from "../../../../lib/api/client";
import { PageHeader } from "../../../../components/common/page-header";
import { formatDateTime } from "../../../../lib/utils";
import { GpsIndicator } from "../../../../components/common/gps-indicator";
import { Badge, statusVariant } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Label } from "../../../../components/ui/label";
import { Select } from "../../../../components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "../../../../components/ui/data-states";
import { AiPanel } from "../../../../components/common/ai-panel";
import { cn } from "../../../../lib/utils";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STAGES = ["SCHEDULED", "IN_PROGRESS", "SUBMITTED", "APPROVED"] as const;

export default function InspectionDetailPage() {
  const params = useParams<{ id: string }>();
  const inspectionId = params.id;
  const { can } = useAuth();
  const geo = useGeolocation();

  // Saved observations, read through the GET route added by Account 2.
  const { data: saved, loading: obsLoading, error: obsError, reload: reloadObs } = useAsync<InspectionObservation[]>(
    async () => (await observationsApi.list(inspectionId)).data,
    [inspectionId]
  );
  const [flaggedIds, setFlaggedIds] = React.useState<string[]>([]);
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<(typeof SEVERITIES)[number]>("MEDIUM");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [approving, setApproving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);


  async function addObservation(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setServerError(null);

    const parsed = observationCreateSchema.safeParse({
      inspectionId,
      description,
      severity,
      ...(geo.latitude !== null ? { latitude: geo.latitude } : {}),
      ...(geo.longitude !== null ? { longitude: geo.longitude } : {}),
      clientOperationId: crypto.randomUUID(),
      clientCreatedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      await observationsApi.create(inspectionId, parsed.data);
      reloadObs();
      setDescription("");
      setSeverity("MEDIUM");
      setNotice("Observation recorded.");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Unable to save this observation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function approve() {
    if (approving) return;
    setApproving(true);
    setServerError(null);
    try {
      await inspectionsApi.approve(inspectionId);
      setNotice("Inspection approved.");
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError
          ? err.status === 403
            ? "Only submitted or reviewed inspections can be approved, and only by an authorized approver."
            : err.message
          : "Unable to approve this inspection."
      );
    } finally {
      setApproving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Inspection"
        description={`Record ${inspectionId.slice(0, 12)} — add field observations and evidence.`}
        actions={
          can("inspections.approve") ? (
            <Button variant="outline" onClick={approve} disabled={approving}>
              {approving ? "Approving…" : "Approve inspection"}
            </Button>
          ) : undefined
        }
      />

      <ol className="mb-5 flex flex-wrap items-center gap-2" aria-label="Inspection workflow">
        {STAGES.map((stage, idx) => (
          <li key={stage} className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-1 text-xs", idx === 0 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
              {stage.replace(/_/g, " ")}
            </span>
            {idx < STAGES.length - 1 ? <span className="text-muted-foreground">→</span> : null}
          </li>
        ))}
      </ol>

      {notice ? (
        <p role="status" className="mb-3 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
          {notice}
        </p>
      ) : null}
      {serverError ? (
        <p role="alert" className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add observation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addObservation} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="obs-desc">What did you observe?</Label>
                <textarea
                  id="obs-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Describe the condition, location and any immediate risk."
                />
                {fieldErrors.description ? (
                  <p className="text-xs text-destructive">{fieldErrors.description.join(", ")}</p>
                ) : null}
              </div>

              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">Severity</legend>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={severity === s}
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "min-h-11 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        severity === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <GpsIndicator geo={geo} onCapture={geo.capture} />
              </div>

              <div className="rounded-md border border-dashed border-border p-3">
                <p className="text-xs font-medium">Photo evidence</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Photo capture is available in the mobile field app. On web, evidence is attached through the
                  Documents module once the file upload endpoint is wired to storage.
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Saving…" : "Record observation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AiPanel
            title="AI Inspection Intelligence"
            inspectionId={inspectionId}
            mode="inspection"
            onFlaggedObservations={setFlaggedIds}
          />

          <Card>
            <CardHeader>
              <CardTitle>Recorded observations{saved ? ` (${saved.length})` : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {obsLoading ? (
                <LoadingState label="Loading observations…" />
              ) : obsError ? (
                <ErrorState message={obsError} onRetry={reloadObs} />
              ) : !saved || saved.length === 0 ? (
                <EmptyState
                  title="No observations recorded"
                  description="Observations you record for this inspection will appear here."
                />
              ) : (
                saved.map((o) => {
                  const isFlagged = flaggedIds.includes(o.id);
                  return (
                    <div
                      key={o.id}
                      className={cn(
                        "rounded-md border p-3 transition-colors",
                        isFlagged
                          ? "border-destructive/60 bg-destructive/5 shadow-sm"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          {isFlagged ? (
                            <Badge variant="destructive" className="text-[10px] uppercase tracking-wider mb-1">
                              AI Flagged Hazard
                            </Badge>
                          ) : null}
                          <p className="text-sm">{o.description}</p>
                        </div>
                        <Badge variant={statusVariant(o.severity)}>{o.severity}</Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{o.clientCreatedAt ? formatDateTime(o.clientCreatedAt) : "Time not recorded"}</span>
                        <span className="font-mono">
                          {o.latitude !== null && o.longitude !== null
                            ? `${o.latitude.toFixed(5)}, ${o.longitude.toFixed(5)}`
                            : "No GPS"}
                        </span>
                        <Badge variant={o.photoDocumentId ? "success" : "secondary"}>
                          {o.photoDocumentId ? "Evidence attached" : "No evidence"}
                        </Badge>
                        {o.syncStatus ? <Badge variant={statusVariant(o.syncStatus)}>{o.syncStatus}</Badge> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
