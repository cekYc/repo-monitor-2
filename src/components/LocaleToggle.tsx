"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
      className="h-9 px-3 grid place-items-center rounded-lg border border-hairline text-muted hover:bg-panel hover:text-fg transition-colors cursor-pointer text-xs font-medium tnum"
      title={locale === "tr" ? "Switch to English" : "Türkçe'ye Geç"}
    >
      {locale === "tr" ? "EN" : "TR"}
    </button>
  );
}
