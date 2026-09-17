import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type Locale,
  type TranslationKey,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  getTranslation,
} from "@sih/config";

const MOBILE_LOCALE_KEY = "coalguard.mobile.locale";

interface MobileI18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nCtx = React.createContext<MobileI18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  React.useEffect(() => {
    AsyncStorage.getItem(MOBILE_LOCALE_KEY).then((val) => {
      if (val && (val === "en" || val === "hi" || val === "te")) {
        setLocaleState(val as Locale);
      }
    }).catch(() => {});
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(MOBILE_LOCALE_KEY, next).catch(() => {});
  }, []);

  const t = React.useCallback(
    (key: TranslationKey) => getTranslation(key, locale),
    [locale]
  );

  const value = React.useMemo<MobileI18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): MobileI18nContextValue {
  const ctx = React.useContext(I18nCtx);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: TranslationKey) => getTranslation(key, DEFAULT_LOCALE),
    };
  }
  return ctx;
}
