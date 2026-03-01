"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Badge {
  id: string;
  earned: boolean;
  value?: string;
}

interface PersonaResult {
  username: string;
  commitHours: number[];
  commitDays: number[];
  badges: Badge[];
  peakHour: number;
  peakDay: number;
  totalCommits: number;
  languageCount: number;
  longestStreak: number;
}

interface DeveloperPersonaProps {
  username: string;
  token: string;
}

const BADGE_CONFIG: Record<string, { emoji: string; color: string; gradient: string }> = {
  nightOwl: { emoji: "🦉", color: "text-indigo-600 dark:text-indigo-400", gradient: "from-indigo-500 to-purple-600" },
  earlyBird: { emoji: "🐦", color: "text-amber-600 dark:text-amber-400", gradient: "from-amber-400 to-orange-500" },
  weekendWarrior: { emoji: "⚔️", color: "text-red-600 dark:text-red-400", gradient: "from-red-500 to-rose-600" },
  polyglot: { emoji: "🌍", color: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-600" },
  streaker: { emoji: "🔥", color: "text-orange-600 dark:text-orange-400", gradient: "from-orange-500 to-red-500" },
  refactorMaster: { emoji: "♻️", color: "text-cyan-600 dark:text-cyan-400", gradient: "from-cyan-500 to-blue-600" },
};

export default function DeveloperPersona({ username, token }: DeveloperPersonaProps) {
  const { t, locale } = useLocale();
  const [data, setData] = useState<PersonaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Reset state when username changes
  useEffect(() => {
    setData(null);
    setFetched(false);
    setExpanded(false);
    setError(null);
  }, [username]);

  const DAY_NAMES_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNames = locale === "tr" ? DAY_NAMES_TR : DAY_NAMES_EN;

  const fetchPersona = useCallback(async () => {
    if (fetched && data) {
      setExpanded((v) => !v);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ username });
      if (token) params.set("token", token);
      const res = await fetch(`/api/persona?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error");
      }
      const result: PersonaResult = await res.json();
      setData(result);
      setFetched(true);
      setExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [username, token, fetched, data]);

  // Build chart data
  const hourChartData = data
    ? data.commitHours.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        commits: count,
      }))
    : [];

  const dayChartData = data
    ? data.commitDays.map((count, i) => ({
        day: dayNames[i],
        commits: count,
      }))
    : [];

  const earnedBadges = data?.badges.filter((b) => b.earned) || [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={fetchPersona}
        disabled={loading}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {t("persona.title")}
          </span>
          {data && earnedBadges.length > 0 && (
            <div className="flex gap-1">
              {earnedBadges.slice(0, 4).map((b) => (
                <span key={b.id} className="text-base">
                  {BADGE_CONFIG[b.id]?.emoji}
                </span>
              ))}
              {earnedBadges.length > 4 && (
                <span className="text-xs text-gray-400">+{earnedBadges.length - 4}</span>
              )}
            </div>
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
        <div className="px-5 pb-5 space-y-6 border-t border-gray-100 dark:border-gray-800">
          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">
                {t("persona.badges")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {earnedBadges.map((badge) => {
                  const cfg = BADGE_CONFIG[badge.id];
                  const nameKey = `persona.${badge.id}` as Parameters<typeof t>[0];
                  const descKey = `persona.${badge.id}Desc` as Parameters<typeof t>[0];
                  return (
                    <div
                      key={badge.id}
                      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-linear-to-br ${cfg.gradient} bg-opacity-10`}
                    >
                      <div className="absolute inset-0 opacity-5 bg-linear-to-br from-white to-transparent" />
                      <div className="relative z-10 flex items-start gap-2">
                        <span className="text-2xl">{cfg.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {t(nameKey)}
                          </p>
                          <p className="text-xs text-white/70 mt-0.5">
                            {t(descKey)}
                          </p>
                          {badge.value && (
                            <p className="text-xs font-mono text-white/90 mt-1">
                              {badge.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.totalCommits === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">{t("persona.noData")}</p>
          )}

          {data.totalCommits > 0 && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {`${data.peakHour.toString().padStart(2, "0")}:00`}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("persona.productivePeak")}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {dayNames[data.peakDay]}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t("persona.activeDays")}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {data.longestStreak}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    🔥 Streak
                  </div>
                </div>
              </div>

              {/* Commit Hour Distribution */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t("persona.commitHours")}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        interval={2}
                        stroke="#9ca3af"
                      />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="commits"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        name="Commits"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Day Distribution */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t("persona.activeDays")}
                </h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="commits"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Commits"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
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
