"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import UserCompare from "@/components/UserCompare";
import type { UserAnalysis } from "@/lib/github";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("repo-monitor-gh-token") || "";
}

export default function CompareView({ initialA = "" }: { initialA?: string }) {
  const { t } = useLocale();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState("");
  const [userA, setUserA] = useState<UserAnalysis | null>(null);
  const [userB, setUserB] = useState<UserAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    setError(null);
    setUserA(null);
    setUserB(null);
    try {
      const fetchUser = async (u: string) => {
        const res = await fetch(`/api/analyze?username=${encodeURIComponent(u)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("error.generic"));
        return data as UserAnalysis;
      };
      const [ra, rb] = await Promise.all([fetchUser(a.trim()), fetchUser(b.trim())]);
      setUserA(ra);
      setUserB(rb);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setLoading(false);
    }
  }, [a, b, t]);

  const inputClass =
    "w-full h-11 px-3.5 rounded-xl border border-hairline bg-canvas text-fg placeholder:text-faint outline-none focus:border-accent transition-colors text-sm";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline bg-surface p-5 md:p-6">
        <h2 className="text-base font-semibold text-fg mb-4">{t("nav.compare")}</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); run(); }}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center"
        >
          <input className={inputClass} placeholder={t("search.username.placeholder")} value={a} onChange={(e) => setA(e.target.value)} />
          <span className="text-center text-xs text-faint font-mono hidden sm:block">vs</span>
          <input className={inputClass} placeholder={t("search.compare.placeholder")} value={b} onChange={(e) => setB(e.target.value)} />
          <button
            type="submit"
            disabled={loading || !a.trim() || !b.trim()}
            className="h-11 px-6 rounded-xl bg-accent text-accent-fg font-medium text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "…" : t("search.compare.button")}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-hairline bg-danger-soft p-4 text-center">
          <p className="text-danger font-medium text-sm">{error}</p>
        </div>
      )}

      {userA && userB && <UserCompare userA={userA} userB={userB} />}
    </div>
  );
}
