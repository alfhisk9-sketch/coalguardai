"use client";

import * as React from "react";
import { MapPin, MapPinOff } from "lucide-react";
import { mockApi, type MockAttendance } from "../../../lib/api/mock";
import { useAsync } from "../../../lib/hooks/use-async";
import { formatDateTime } from "../../../lib/utils";
import { PageHeader } from "../../../components/common/page-header";
import { KpiCard } from "../../../components/common/kpi-card";
import { Badge, statusVariant } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

/** DEMO DATA. /api/attendance is POST-only in C1 — no read endpoint. No biometrics. */
export default function AttendancePage() {
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = React.useState("ALL");
  const { data, loading, error, reload } = useAsync<MockAttendance[]>(() => mockApi.listAttendance(), []);

  const records = data ?? [];
  const rows = records.filter((r) => (status === "ALL" || r.status === status) && r.attendanceDate === date);
  const present = records.filter((r) => r.status === "PRESENT").length;
  const pending = records.filter((r) => r.syncStatus === "PENDING").length;

  return (
    <>
      <PageHeader title="Attendance" description="Daily worker attendance, captured from the field app or recorded on the web." demo />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Records" value={records.length} />
        <KpiCard label="Present" value={present} tone="success" />
        <KpiCard label="Absent / leave" value={records.filter((r) => r.status === "ABSENT" || r.status === "ON_LEAVE").length} />
        <KpiCard label="Pending sync" value={pending} tone={pending > 0 ? "warning" : "success"} />
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <Input aria-label="Attendance date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading attendance…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No attendance records" description="No records for the selected date and status." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead className="hidden md:table-cell">Contractor</TableHead>
              <TableHead>Check in</TableHead>
              <TableHead>Check out</TableHead>
              <TableHead>GPS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.workerName}</TableCell>
                <TableCell className="hidden text-xs md:table-cell">{r.contractorName}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{r.checkIn ? formatDateTime(r.checkIn) : "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{r.checkOut ? formatDateTime(r.checkOut) : "—"}</TableCell>
                <TableCell>
                  {r.latitude !== null && r.longitude !== null ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Captured
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinOff className="h-3.5 w-3.5" aria-hidden="true" /> None
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(r.status)}>{r.status.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant={statusVariant(r.syncStatus)}>{r.syncStatus}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
