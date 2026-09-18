import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: "default" | "success" | "warning" | "destructive";
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  trend?: {
    value: string;
    positive?: boolean;
  };
  status?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  sublabel,
  tone = "default",
  icon: Icon,
  trend,
  status,
  className,
}: KpiCardProps) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];

  const iconBgClass = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className={cn("p-4 transition-all duration-150 hover:shadow-md hover:border-border/90 relative overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        {Icon ? (
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", iconBgClass)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className={cn("text-2xl font-bold tabular-nums tracking-tight", toneClass)}>{value}</p>
        {trend ? (
          <span
            className={cn(
              "inline-flex items-center text-[11px] font-semibold",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            {trend.positive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
            {trend.value}
          </span>
        ) : null}
        {status ? (
          <Badge variant={tone === "default" ? "secondary" : tone} className="text-[9px] px-1 py-0">
            {status}
          </Badge>
        ) : null}
      </div>

      {sublabel ? <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{sublabel}</p> : null}
    </Card>
  );
}
