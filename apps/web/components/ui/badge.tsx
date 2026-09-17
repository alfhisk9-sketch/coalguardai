import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Maps common backend status/severity/priority enums to a badge variant, so every
 * module renders status consistently instead of each page inventing its own mapping. */
export function statusVariant(status: string): BadgeProps["variant"] {
  const positive = ["COMPLIANT", "APPROVED", "COMPLETED", "VERIFIED", "CLOSED", "RESOLVED", "SYNCED", "ACTIVE", "NORMAL", "PRESENT"];
  const negative = ["OVERDUE", "NON_COMPLIANT", "REJECTED", "CRITICAL", "EXCEEDED", "FAILED", "CONFLICT", "TERMINATED", "SUSPENDED"];
  const warning = ["DUE_SOON", "UNDER_REVIEW", "IN_PROGRESS", "SCHEDULED", "SUBMITTED", "PENDING", "OPEN", "HIGH", "WARNING", "REPORTED", "UNDER_INVESTIGATION"];
  if (positive.includes(status)) return "success";
  if (negative.includes(status)) return "destructive";
  if (warning.includes(status)) return "warning";
  return "secondary";
}
