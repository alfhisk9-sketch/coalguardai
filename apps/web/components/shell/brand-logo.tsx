import * as React from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";

/**
 * Pure scalable SVG icon representing CoalGuard AI:
 * - Faceted safety shield inspired by coal crystal geometry
 * - Safety gold / amber & mining green node accents
 * - Modern industrial 'CG' monogram
 */
export function CoalGuardIcon({ className = "h-7 w-7", ariaHidden = true }: { className?: string; ariaHidden?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
    >
      <defs>
        {/* Coal Navy Shield Gradient */}
        <linearGradient id="cg-coal-grad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#080D1A" />
        </linearGradient>

        {/* Safety Amber / Mining Gold Accent Gradient */}
        <linearGradient id="cg-gold-grad" x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Subtle AI Cyan/Teal glow line */}
        <linearGradient id="cg-ai-grad" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Outer Faceted Safety Shield */}
      <path
        d="M24 4L40 9V22C40 32.5 33.2 41.8 24 45C14.8 41.8 8 32.5 8 22V9L24 4Z"
        fill="url(#cg-coal-grad)"
        stroke="url(#cg-gold-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Internal Shield Facet Lines (Geometric Coal Structure) */}
      <path
        d="M24 4V45M8 22L24 28L40 22M14 10L24 28L34 10"
        stroke="#334155"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />

      {/* Digital AI Circuit Nodes on Shield Perimeter */}
      <circle cx="24" cy="4" r="1.8" fill="#F59E0B" />
      <circle cx="8" cy="22" r="1.5" fill="#10B981" />
      <circle cx="40" cy="22" r="1.5" fill="#06B6D4" />
      <circle cx="24" cy="45" r="1.5" fill="#F59E0B" />

      {/* Monogram 'CG' in Foreground */}
      <text
        x="24"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F8FAFC"
        fontSize="14"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5px"
      >
        CG
      </text>

      {/* Sub-accent AI Dot indicator */}
      <circle cx="34" cy="29" r="1.5" fill="#10B981" />
    </svg>
  );
}

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
  withSubtitle?: boolean;
  className?: string;
}

export function BrandLogo({
  size = "md",
  withLink = true,
  withSubtitle = true,
  className,
}: BrandLogoProps) {
  const iconSize = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-10 w-10",
  }[size];

  const titleSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  const subtitleSize = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <CoalGuardIcon className={iconSize} ariaHidden={false} />
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={cn("font-bold tracking-tight text-foreground", titleSize)}>
            CoalGuard
          </span>
          <span className={cn("font-bold text-accent tracking-tight", titleSize)}>
            AI
          </span>
        </div>
        {withSubtitle ? (
          <span className={cn("text-muted-foreground font-medium mt-0.5", subtitleSize)}>
            Ministry of Coal / CIL
          </span>
        ) : null}
      </div>
    </div>
  );

  if (withLink) {
    return (
      <Link
        href="/dashboard"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-90"
        aria-label="CoalGuard AI Dashboard"
      >
        {content}
      </Link>
    );
  }

  return content;
}
