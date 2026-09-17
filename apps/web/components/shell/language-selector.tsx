"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES, type Locale } from "@sih/config";
import { useI18n } from "../../lib/i18n";
import { Select } from "../ui/select";

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
      <Select
        id="language-select"
        aria-label={t("language_label")}
        className="h-8 w-28 text-xs font-medium"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeName}
          </option>
        ))}
      </Select>
    </div>
  );
}
