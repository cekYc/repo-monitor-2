"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
      className="fixed top-4 right-18 z-50 px-3 py-2.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer text-sm font-bold"
      title={locale === "tr" ? "Switch to English" : "Türkçe'ye Geç"}
    >
      {locale === "tr" ? "EN" : "TR"}
    </button>
  );
}
