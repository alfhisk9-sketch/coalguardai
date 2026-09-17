import * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

export function KpiCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];

  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {sublabel ? <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p> : null}
    </Card>
  );
}
