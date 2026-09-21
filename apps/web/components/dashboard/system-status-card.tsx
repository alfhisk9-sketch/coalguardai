"use client";

import * as React from "react";
import { Activity, CheckCircle2, AlertCircle, Database, Sparkles, Wifi } from "lucide-react";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export function SystemStatusCard() {
  const { isDemo } = useAuth();
  const { t } = useI18n();
  const [isOnline, setIsOnline] = React.useState(true);
  const [apiStatus, setApiStatus] = React.useState<"healthy" | "degraded">("healthy");
  const [dbStatus, setDbStatus] = React.useState<"connected" | "disconnected">("connected");
  const [geminiStatus, setGeminiStatus] = React.useState<"connected" | "offline">("connected");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);

      let mounted = true;
      fetch("/api/health")
        .then((res) => res.json())
        .then((data) => {
          if (mounted && data?.status === "ok") {
            setApiStatus("healthy");
            setDbStatus("connected");
            setGeminiStatus("connected");
          }
        })
        .catch(() => {
          if (mounted) setApiStatus("degraded");
        });

      return () => {
        mounted = false;
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }
  }, []);

  interface ServiceItem {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    status: string;
    variant: "default" | "secondary" | "destructive" | "success" | "warning";
    isOk: boolean;
  }

  const services: ServiceItem[] = [
    {
      name: t("system_service_supabase"),
      icon: Database,
      status: dbStatus === "connected" ? t("status_connected") : t("status_pending"),
      variant: dbStatus === "connected" ? "success" : "warning",
      isOk: dbStatus === "connected",
    },
    {
      name: t("system_service_gemini"),
      icon: Sparkles,
      status: geminiStatus === "connected" ? t("status_connected") : t("status_pending"),
      variant: geminiStatus === "connected" ? "success" : "warning",
      isOk: geminiStatus === "connected",
    },
    {
      name: t("system_service_offline"),
      icon: Wifi,
      status: isOnline ? t("status_ready") : t("status_pending"),
      variant: isOnline ? "success" : "warning",
      isOk: isOnline,
    },
    {
      name: t("system_service_api"),
      icon: Activity,
      status: apiStatus === "healthy" ? t("status_healthy") : t("status_pending"),
      variant: apiStatus === "healthy" ? "success" : "warning",
      isOk: apiStatus === "healthy",
    },
  ];

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-sm font-bold tracking-tight">
              {t("system_status_title")}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Environment:</span>
            <Badge variant={isDemo ? "warning" : "success"} className="text-[10px] font-bold uppercase tracking-wider">
              {isDemo ? "DEMO WORKSPACE" : "PRODUCTION"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/70 bg-card"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{s.name}</span>
                </div>
                <Badge variant={s.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                  {s.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
