"use client";

import * as React from "react";
import {
  type Locale,
  type TranslationKey,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getTranslation,
} from "@sih/config";

const LOCALE_STORAGE_KEY = "coalguard.locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      if (stored && (stored === "en" || stored === "hi" || stored === "te")) {
        setLocaleState(stored);
        if (typeof document !== "undefined") {
          document.documentElement.lang = stored;
        }
      }
    } catch {
      // LocalStorage not available (SSR / private browsing)
    } finally {
      setMounted(true);
    }
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore
    }
  }, []);

  const t = React.useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey) => getTranslation(key, DEFAULT_LOCALE),
    };
  }
  return ctx;
}
