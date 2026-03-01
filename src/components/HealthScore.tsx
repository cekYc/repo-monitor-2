"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface RepoHealth {
  name: string;
  score: number;
  checks: {
    hasReadme: boolean;
    hasLicense: boolean;
    hasDescription: boolean;
    hasCI: boolean;
    recentUpdate: boolean;
    lowIssueRatio: boolean;
  };
}

interface HealthResult {
  username: string;
  overallScore: number;
  grade: "excellent" | "good" | "fair" | "poor";
  repos: RepoHealth[];
}

interface HealthScoreProps {
  username: string;
  token: string;
}

const GRADE_CONFIG = {
  excellent: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/30", emoji: "🏆" },
  good: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", ring: "ring-blue-500/30", emoji: "✅" },
  fair: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/30", emoji: "⚠️" },
  poor: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500", ring: "ring-red-500/30", emoji: "❌" },
};

export default function HealthScore({ username, token }: HealthScoreProps) {
  const { t } = useLocale();
  const [data, setData] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (fetched && data) {
      setExpanded((v) => !v);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ username });
      if (token) params.set("token", token);
      const res = await fetch(`/api/health-score?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error");
      }
      const result: HealthResult = await res.json();
      setData(result);
      setFetched(true);
      setExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [username, token, fetched, data]);

  const gradeKey = data?.grade || "poor";
  const config = GRADE_CONFIG[gradeKey];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={fetchHealth}
        disabled={loading}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {t("health.title")}
          </span>
          {data && (
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.emoji} {data.overallScore}/100 — {t(`health.${gradeKey}` as Parameters<typeof t>[0])}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {expanded && data && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 dark:border-gray-800">
          {/* Overall Score Gauge */}
          <div className="flex flex-col items-center py-4">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ring-8 ${config.ring}`}>
              {/* Background circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none"
                  className={config.bg}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(data.overallScore / 100) * 264} 264`}
                  style={{ opacity: 0.8 }}
                />
              </svg>
              <div className="text-center z-10">
                <span className={`text-3xl font-extrabold ${config.color}`}>{data.overallScore}</span>
                <span className="block text-xs text-gray-400">/100</span>
              </div>
            </div>
            <p className={`mt-3 text-sm font-semibold ${config.color}`}>
              {config.emoji} {t(`health.${gradeKey}` as Parameters<typeof t>[0])}
            </p>
          </div>

          {/* Average Health Checks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: "hasReadme", label: t("health.hasReadme") },
              { key: "hasLicense", label: t("health.hasLicense") },
              { key: "hasDescription", label: t("health.hasDescription") },
              { key: "hasCI", label: t("health.hasCI") },
              { key: "recentUpdate", label: t("health.recentUpdate") },
              { key: "lowIssueRatio", label: t("health.lowIssues") },
            ].map(({ key, label }) => {
              const percentage = data.repos.length > 0
                ? Math.round(
                    (data.repos.filter(
                      (r) => r.checks[key as keyof RepoHealth["checks"]]
                    ).length / data.repos.length) * 100
                  )
                : 0;
              return (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center"
                >
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {percentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-Repo Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t("health.repoBreakdown")}
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.repos.map((repo) => {
                const repoGrade =
                  repo.score >= 80
                    ? "excellent"
                    : repo.score >= 60
                      ? "good"
                      : repo.score >= 40
                        ? "fair"
                        : "poor";
                const repoConfig = GRADE_CONFIG[repoGrade];
                return (
                  <div
                    key={repo.name}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block">
                        {repo.name}
                      </span>
                      <div className="flex gap-1.5 mt-1">
                        {repo.checks.hasReadme && <span className="text-xs" title="README">📄</span>}
                        {repo.checks.hasLicense && <span className="text-xs" title="LICENSE">⚖️</span>}
                        {repo.checks.hasDescription && <span className="text-xs" title="Description">📝</span>}
                        {repo.checks.hasCI && <span className="text-xs" title="CI/CD">⚙️</span>}
                        {repo.checks.recentUpdate && <span className="text-xs" title="Recent">🕐</span>}
                        {repo.checks.lowIssueRatio && <span className="text-xs" title="Low Issues">✅</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${repoConfig.bg}`}
                          style={{ width: `${repo.score}%`, opacity: 0.8 }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${repoConfig.color} w-8 text-right`}>
                        {repo.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tip */}
          {data.overallScore < 80 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center italic">
              💡 {t("health.tip")}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 pb-4">
          <p className="text-sm text-red-500">❌ {error}</p>
        </div>
      )}
    </div>
  );
}
