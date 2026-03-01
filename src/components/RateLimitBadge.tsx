"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export default function RateLimitBadge({ token }: { token: string }) {
  const { t } = useLocale();
  const [info, setInfo] = useState<RateLimitInfo | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchRateLimit = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (token) params.set("token", token);
      const res = await fetch(`/api/rate-limit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(fetchRateLimit, 0);
    const interval = setInterval(fetchRateLimit, 60_000); // refresh every 60s
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [fetchRateLimit]);

  if (!info) return null;

  const pct = Math.round((info.remaining / info.limit) * 100);
  const resetDate = new Date(info.reset * 1000);
  const resetStr = resetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isLow = pct < 20;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded overlay */}
      {expanded && (
        <div className="mb-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-64 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {t("rateLimit.label")}
            </span>
            <span className="text-xs text-gray-400">
              {info.remaining}/{info.limit}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isLow
                  ? "bg-red-500"
                  : pct < 50
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{info.used} used</span>
            <span>
              {t("rateLimit.reset")}: {resetStr}
            </span>
          </div>

          {isLow && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400 font-medium">
              ⚠️ {t("rateLimit.warning")}
            </p>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border transition-all duration-300 hover:scale-105 cursor-pointer text-xs font-medium ${
          isLow
            ? "bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isLow
              ? "bg-red-500 animate-pulse"
              : pct < 50
                ? "bg-amber-500"
                : "bg-green-500"
          }`}
        />
        <span>{t("rateLimit.label")}: {info.remaining}/{info.limit}</span>
      </button>
    </div>
  );
}
