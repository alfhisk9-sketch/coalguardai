"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, X, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { notificationsApi, type NotificationView } from "../../lib/api/notifications";
import { useI18n } from "../../lib/i18n";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

function getSeverity(n: NotificationView): "CRITICAL" | "WARNING" | "INFO" {
  const text = `${n.type} ${n.title} ${n.body ?? ""}`.toUpperCase();
  if (text.includes("CRITICAL") || text.includes("FATAL") || text.includes("OVERDUE") || text.includes("DANGER")) {
    return "CRITICAL";
  }
  if (text.includes("WARN") || text.includes("DUE_SOON") || text.includes("ATTENTION") || text.includes("HIGH")) {
    return "WARNING";
  }
  return "INFO";
}

function formatRelativeTime(dateStr: string | undefined, t: (k: any) => string): string {
  if (!dateStr) return t("notification_time_just_now");
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return t("notification_time_just_now");
    const diffMins = Math.floor(diffSec / 60);
    if (diffMins < 60) return `${diffMins}${t("notification_time_mins_ago")}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}${t("notification_time_hours_ago")}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}${t("notification_time_days_ago")}`;
  } catch {
    return t("notification_time_just_now");
  }
}

export function NotificationCenter() {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationView[]>([]);
  const [loading, setLoading] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.list();
      setNotifications(res.data ?? []);
    } catch {
      // Offline / unauthenticated fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Outside click and Escape key dismissal
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // Ignore
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.isRead);
    for (const item of unread) {
      try {
        await notificationsApi.markRead(item.id);
      } catch {
        // Continue
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `${t("notifications_title")}, ${unreadCount} ${t("unread_label")}`
            : t("notifications_title")
        }
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("notifications_title")}
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-lg border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("notifications_title")}
              </p>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount} {t("unread_label")}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary hover:bg-secondary transition-colors"
                  title={t("mark_all_read")}
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>{t("mark_all_read")}</span>
                </button>
              ) : null}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/60 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <CheckCheck className="h-8 w-8 text-success/60 mb-2" />
                <p className="text-xs font-semibold text-foreground">{t("no_notifications")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("all_caught_up")}</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((item) => {
                const severity = getSeverity(item);
                const Icon =
                  severity === "CRITICAL"
                    ? AlertCircle
                    : severity === "WARNING"
                    ? AlertTriangle
                    : Info;
                const toneClass =
                  severity === "CRITICAL"
                    ? "text-destructive bg-destructive/10"
                    : severity === "WARNING"
                    ? "text-warning bg-warning/10"
                    : "text-primary bg-primary/10";

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 transition-colors hover:bg-secondary/40 ${
                      item.isRead ? "opacity-75" : "bg-card"
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant={
                            severity === "CRITICAL"
                              ? "destructive"
                              : severity === "WARNING"
                              ? "warning"
                              : "secondary"
                          }
                          className="text-[9px] px-1 py-0"
                        >
                          {severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt, t)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-foreground line-clamp-1">
                        {item.title}
                      </p>
                      {item.body ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                          {item.body}
                        </p>
                      ) : null}
                    </div>
                    {!item.isRead ? (
                      <button
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2 bg-secondary/20 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="inline-block text-[11px] font-medium text-primary hover:underline"
            >
              {t("view_all_notifications")} →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
