import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  suffix,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
  suffix?: string;
}) {
  const toneClass = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">
            {value}
            {suffix ? <span className="ml-0.5 text-xs font-normal text-muted-foreground">{suffix}</span> : null}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
