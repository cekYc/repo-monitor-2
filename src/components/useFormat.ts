"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";

/** Locale-bound number and date formatting.
 *
 *  Translating the labels is only half the job: a date printed as "12 Eyl
 *  2026" under English, or a count grouped with the wrong separator, reads as
 *  a half-finished translation. Everything numeric goes through here. */
export default function useFormat() {
  const { locale } = useLocale();

  return useMemo(() => {
    const tag = locale === "tr" ? "tr-TR" : "en-US";
    return {
      tag,
      num: (value: number) => value.toLocaleString(tag),
      date: (value: string | number) =>
        new Date(value).toLocaleDateString(tag, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    };
  }, [locale]);
}
