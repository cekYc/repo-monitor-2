"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { Locale, t, TranslationKey } from "@/lib/i18n";
import { notifyStoredChange, useStoredString } from "@/lib/use-stored";

export const LOCALE_KEY = "repo-monitor-locale";

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

/** Children always render. The locale arrives from a cookie during SSR and the
 *  stored preference takes over on the client, so no screen is ever withheld
 *  waiting for hydration. */
export function LocaleProvider({
  initialLocale = "tr",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const stored = useStoredString(LOCALE_KEY, initialLocale);
  const locale: Locale = stored === "en" ? "en" : "tr";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // blocked storage: the cookie below still carries the choice
    }
    document.cookie = `${LOCALE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    notifyStoredChange();
  }, []);

  const translate = useCallback((key: TranslationKey) => t(key, locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translate }}>
      {children}
    </LocaleContext.Provider>
  );
}
