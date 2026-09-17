import { cn } from "../../lib/utils";

/** Compliance score meter. Colour thresholds are a UI convention, not a regulatory grade. */
export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= 85 ? "bg-success" : clamped >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="img" aria-label={`Compliance score ${clamped} of 100`}>
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">{clamped}%</span>
    </div>
  );
}
