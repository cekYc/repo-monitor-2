"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  const next = locale === "tr" ? "en" : "tr";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="btn btn-ghost h-9 w-9 px-0 tnum"
      title={t("locale.switch")}
      aria-label={t("locale.switch")}
    >
      {next.toUpperCase()}
    </button>
  );
}
