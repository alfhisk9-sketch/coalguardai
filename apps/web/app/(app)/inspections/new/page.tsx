"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { inspectionCreateSchema } from "@sih/validation";
import { inspectionsApi } from "../../../../lib/api/inspections";
import { useGeolocation } from "../../../../lib/hooks/use-geolocation";
import { ApiRequestError } from "../../../../lib/api/client";
import { PageHeader } from "../../../../components/common/page-header";
import { MinePicker } from "../../../../components/common/mine-picker";
import { GpsIndicator } from "../../../../components/common/gps-indicator";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select } from "../../../../components/ui/select";

const INSPECTION_TYPES = ["Routine safety inspection", "Ventilation inspection", "Haul road inspection", "Explosives handling audit", "Environmental compliance check"];

export default function NewInspectionPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const [mineId, setMineId] = React.useState<string | null>(null);
  const [inspectionType, setInspectionType] = React.useState(INSPECTION_TYPES[0] ?? "");
  const [scheduledDate, setScheduledDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // prevents duplicate submissions
    setFieldErrors({});
    setServerError(null);

    // Validated client-side with the SAME shared Zod schema the API route uses,
    // so the two can never drift (project rule 27).
    const parsed = inspectionCreateSchema.safeParse({
      mineId: mineId ?? "",
      inspectionType,
      scheduledDate,
      ...(geo.latitude !== null ? { latitude: geo.latitude } : {}),
      ...(geo.longitude !== null ? { longitude: geo.longitude } : {}),
      // Idempotency key per the C1 sync contract — safe to retry this submission.
      clientOperationId: crypto.randomUUID(),
      clientCreatedAt: new Date().toISOString(),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    setSubmitting(true);
    try {
      const res = await inspectionsApi.create(parsed.data);
      router.push(`/inspections/${res.data.id}`);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError
          ? err.status === 403
            ? "You do not have permission to create inspections at this mine."
            : err.message
          : "Unable to create the inspection."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Start inspection" description="Create an inspection record, then add observations in the field." />

      <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Inspection details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mine">Mine</Label>
              <MinePicker value={mineId} onChange={setMineId} />
              {fieldErrors.mineId ? (
                <p className="text-xs text-destructive">{fieldErrors.mineId.join(", ")}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Inspection type</Label>
              <Select id="type" value={inspectionType} onChange={(e) => setInspectionType(e.target.value)}>
                {INSPECTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              {fieldErrors.inspectionType ? (
                <p className="text-xs text-destructive">{fieldErrors.inspectionType.join(", ")}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Scheduled date</Label>
              <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              {fieldErrors.scheduledDate ? (
                <p className="text-xs text-destructive">{fieldErrors.scheduledDate.join(", ")}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Location</Label>
              <GpsIndicator geo={geo} onCapture={geo.capture} />
            </div>
          </CardContent>
        </Card>

        {serverError ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" size="lg" disabled={submitting || !mineId}>
            {submitting ? "Creating…" : "Create inspection"}
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
