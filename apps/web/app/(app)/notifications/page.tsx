"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { notificationsApi, type NotificationView } from "../../../lib/api/notifications";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Select } from "../../../components/ui/select";
import { Card, CardContent } from "../../../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import { cn } from "../../../lib/utils";

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState("ALL");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const { data, loading, error, reload } = useAsync<NotificationView[]>(async () => (await notificationsApi.list()).data, []);

  const items = data ?? [];
  const rows = filter === "UNREAD" ? items.filter((n) => !n.isRead) : filter === "READ" ? items.filter((n) => n.isRead) : items;

  async function markRead(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      await notificationsApi.markRead(id);
      reload();
    } catch {
      // Failure leaves the item unread; the list reload below surfaces true state.
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Compliance deadlines, critical observations, overdue actions and incident alerts."
        actions={
          <Select aria-label="Filter notifications" className="w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </Select>
        }
      />

      {loading ? (
        <LoadingState label="Loading notifications…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications matching this filter." />
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <Card key={n.id} className={cn(!n.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="flex items-start gap-3 p-4">
                <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", n.isRead ? "text-muted-foreground" : "text-primary")} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Badge variant="outline">{n.type.replace(/_/g, " ")}</Badge>
                    {!n.isRead ? <Badge>Unread</Badge> : null}
                  </div>
                  {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                </div>
                {!n.isRead ? (
                  <Button size="sm" variant="ghost" disabled={busyId === n.id} onClick={() => markRead(n.id)}>
                    {busyId === n.id ? "…" : "Mark read"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
