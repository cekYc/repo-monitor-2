"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getLanguageColor, formatBytes } from "@/lib/utils";
import { RepoCommitHistory } from "@/lib/github";
import { useLocale } from "@/components/LocaleProvider";

interface CommitHistoryProps {
  history: RepoCommitHistory;
}

export default function CommitHistory({ history }: CommitHistoryProps) {
  const { t, locale } = useLocale();
  const { snapshots } = history;
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";
  const otherLabel = locale === "tr" ? "Diğer" : "Other";

  if (snapshots.length < 2) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        {t("commit.notEnough")}
      </div>
    );
  }

  // Get top languages by final snapshot bytes
  const finalSnapshot = snapshots[snapshots.length - 1];
  const topLangs = finalSnapshot.languagePercentages
    .slice(0, 10)
    .map((l) => l.name);

  // Build chart data: each point = one commit (unique idx for XAxis)
  const chartData = snapshots.map((snap, idx) => {
    const point: Record<string, string | number> = {
      idx,
      label: snap.shortSha,
      date: new Date(snap.date).toLocaleDateString(dateLocale, {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
      tickLabel: `${snap.shortSha} · ${new Date(snap.date).toLocaleDateString(dateLocale, { month: "short", day: "numeric" })}`,
      message: snap.message,
      totalBytes: snap.totalBytes,
    };
    // Add percentage for each language
    for (const lang of topLangs) {
      const found = snap.languagePercentages.find((l) => l.name === lang);
      point[lang] = found ? found.value : 0;
    }
    // "Other" = remaining percentage
    const topSum = topLangs.reduce(
      (sum, lang) => sum + ((point[lang] as number) || 0),
      0
    );
    point[otherLabel] = Math.max(0, Math.round((100 - topSum) * 100) / 100);
    return point;
  });

  const displayLangs =
    chartData.some((d) => (d[otherLabel] as number) > 0.5)
      ? [...topLangs, otherLabel]
      : topLangs;

  // Compute changes between first and last snapshot
  const firstSnap = snapshots[0];
  const changes = topLangs.map((lang) => {
    const first =
      firstSnap.languagePercentages.find((l) => l.name === lang)?.value ?? 0;
    const last =
      finalSnapshot.languagePercentages.find((l) => l.name === lang)?.value ?? 0;
    const diff = Math.round((last - first) * 100) / 100;
    return { lang, first, last, diff };
  });

  return (
    <div className="space-y-4">
      {/* Area Chart */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          {t("commit.timeline")} ({snapshots.length} {t("commit.commit")})
        </h4>
        <ResponsiveContainer width="100%" height={chartData.length > 10 ? 320 : 280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: chartData.length > 6 ? 60 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="idx"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={({ x, y, payload }) => {
                const d = chartData[payload.value];
                if (!d) return <g />;
                const showAll = chartData.length <= 20;
                // For large datasets, show every Nth label
                if (!showAll && payload.value % Math.ceil(chartData.length / 12) !== 0 && payload.value !== chartData.length - 1) {
                  return <g />;
                }
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={10}
                      textAnchor={chartData.length > 6 ? "end" : "middle"}
                      fill="#9ca3af"
                      fontSize={9}
                      transform={chartData.length > 6 ? "rotate(-45)" : undefined}
                    >
                      {d.tickLabel as string}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const commit = payload[0]?.payload;
                if (!commit) return null;
                return (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs max-w-xs">
                    <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {commit.label} — {commit.date}
                    </p>
                    <p className="text-gray-400 mb-2 truncate">
                      {commit.message as string}
                    </p>
                    <div className="space-y-1">
                      {payload
                        .filter((p) => (p.value as number) > 0)
                        .sort((a, b) => (b.value as number) - (a.value as number))
                        .map((p) => (
                          <div
                            key={p.dataKey as string}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {p.dataKey as string}
                              </span>
                            </div>
                            <span className="font-mono text-gray-500">
                              {(p.value as number).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                    {commit?.totalBytes && (
                      <p className="text-gray-400 mt-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                        {t("commit.total")}: {formatBytes(commit.totalBytes as number)}
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {displayLangs.map((lang, i) => (
              <Area
                key={lang}
                type="monotone"
                dataKey={lang}
                stackId="1"
                stroke={
                  lang === otherLabel
                    ? "#9ca3af"
                    : getLanguageColor(lang, i)
                }
                fill={
                  lang === otherLabel
                    ? "#9ca3af"
                    : getLanguageColor(lang, i)
                }
                fillOpacity={0.7}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Change Summary */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          {t("commit.changes")}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {changes
            .filter((c) => c.first > 0 || c.last > 0)
            .map((c, i) => (
              <div
                key={c.lang}
                className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-gray-100 dark:border-gray-800 text-xs"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: getLanguageColor(c.lang, i) }}
                  />
                  <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {c.lang}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 font-mono">
                    {c.first.toFixed(1)}%
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                  <span className="text-gray-700 dark:text-gray-200 font-mono font-bold">
                    {c.last.toFixed(1)}%
                  </span>
                  {c.diff !== 0 && (
                    <span
                      className={`font-mono font-bold ${
                        c.diff > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {c.diff > 0 ? "+" : ""}
                      {c.diff.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {displayLangs.map((lang, i) => (
          <div key={lang} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{
                backgroundColor:
                  lang === otherLabel ? "#9ca3af" : getLanguageColor(lang, i),
              }}
            />
            <span className="text-gray-600 dark:text-gray-400">{lang}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
