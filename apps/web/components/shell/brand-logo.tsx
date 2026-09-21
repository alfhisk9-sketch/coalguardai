import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "../../lib/utils";

/**
 * Official CoalGuard AI Brand Icon
 * Uses the supplied official brand asset with exact aspect ratio.
 */
export function CoalGuardIcon({
  className = "h-8 w-8",
  ariaHidden = true,
}: {
  className?: string;
  ariaHidden?: boolean;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-lg", className)}>
      <Image
        src="/branding/coalguard-logo.png"
        alt="CoalGuard AI Logo Icon"
        width={64}
        height={64}
        priority
        className="h-full w-full object-contain"
        aria-hidden={ariaHidden}
      />
    </div>
  );
}

export interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  withLink?: boolean;
  withSubtitle?: boolean;
  className?: string;
  variant?: "full" | "icon" | "horizontal";
}

/**
 * Official CoalGuard AI Brand Identity Component
 * "Safer Mines — Smarter Governance"
 * Strictly integrates the supplied brand logo asset without CSS distortion.
 */
export function BrandLogo({
  size = "md",
  withLink = true,
  withSubtitle = true,
  className,
  variant = "horizontal",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: { h: "h-7", w: "w-7", px: 28 },
    md: { h: "h-9", w: "w-9", px: 36 },
    lg: { h: "h-12", w: "w-12", px: 48 },
  }[size];

  const titleSize = {
    sm: "text-xs font-bold",
    md: "text-sm font-extrabold",
    lg: "text-lg font-extrabold",
  }[size];

  const subtitleSize = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  }[size];

  if (variant === "icon") {
    const iconContent = (
      <CoalGuardIcon className={cn(iconDimensions.h, iconDimensions.w, className)} />
    );
    if (withLink) {
      return (
        <Link
          href="/dashboard"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-90"
          aria-label="CoalGuard AI Dashboard"
        >
          {iconContent}
        </Link>
      );
    }
    return iconContent;
  }

  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className={cn("relative shrink-0 overflow-hidden", iconDimensions.h, iconDimensions.w)}>
        <Image
          src="/branding/coalguard-logo.png"
          alt="CoalGuard AI Official Logo"
          width={iconDimensions.px}
          height={iconDimensions.px}
          priority
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1 tracking-tight">
          <span className={cn("text-foreground font-heading tracking-tight", titleSize)}>
            CoalGuard
          </span>
          <span className={cn("text-amber-500 font-heading tracking-tight", titleSize)}>
            AI
          </span>
        </div>
        {withSubtitle ? (
          <span className={cn("text-muted-foreground font-medium mt-0.5 tracking-tight", subtitleSize)}>
            Safer Mines — Smarter Governance
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
