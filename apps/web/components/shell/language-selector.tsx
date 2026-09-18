"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES, type Locale } from "@sih/config";
import { useI18n } from "../../lib/i18n";
import { Select } from "../ui/select";

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 shadow-sm transition-colors hover:border-border focus-within:ring-2 focus-within:ring-ring ${className}`}
    >
      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Select
        id="language-select"
        aria-label={t("language_label")}
        className="h-7 w-24 border-0 bg-transparent px-1 py-0 pr-6 text-xs font-medium focus-visible:ring-0 shadow-none cursor-pointer"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="bg-popover text-popover-foreground text-xs py-1">
            {l.nativeName}
          </option>
        ))}
      </Select>
    </div>
  );
}
