"use client";

import { createContext, useContext, useState, useSyncExternalStore, useCallback } from "react";
import { Locale, t, TranslationKey } from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "repo-monitor-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "tr";
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  return saved === "en" ? "en" : "tr";
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "tr",
  setLocale: () => {},
  t: (key) => key,
});

export function useLocale() {
  return useContext(LocaleContext);
}

const emptySubscribe = () => () => {};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => t(key, locale),
    [locale]
  );

  if (!mounted) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </LocaleContext.Provider>
  );
}
