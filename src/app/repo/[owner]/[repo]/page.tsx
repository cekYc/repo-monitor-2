"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleToggle from "@/components/LocaleToggle";
import RepoDeepDive from "@/components/RepoDeepDive";
import type { RepoDeepAnalysis } from "@/lib/github";

export default function RepoDeepDivePage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = use(params);
  const { t } = useLocale();
  const [data, setData] = useState<RepoDeepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("repo-monitor-gh-token") || ""
          : "";
      const qs = new URLSearchParams({ owner, repo });
      if (token) qs.set("token", token);

      try {
        const res = await fetch(`/api/repo-analysis?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || t("deep.notFound"));
        if (active) setData(json as RepoDeepAnalysis);
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : t("deep.notFound"));
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [owner, repo, t]);

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg transition-colors"
          >
            {t("deep.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-16">
        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 bg-surface rounded-2xl px-6 py-4 border border-hairline">
              <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-muted text-sm">{t("deep.loading")}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-danger-soft border border-hairline rounded-2xl p-4 text-center">
            <p className="text-danger font-medium">{error}</p>
          </div>
        )}

        {data && !loading && <RepoDeepDive data={data} />}
      </main>
    </div>
  );
}
