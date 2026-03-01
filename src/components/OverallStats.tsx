"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getLanguageColor, formatBytes } from "@/lib/utils";
import { UserAnalysis } from "@/lib/github";
import { useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";

interface OverallStatsProps {
  analysis: UserAnalysis;
  excludedRepos: Set<string>;
  onClearExclusions: () => void;
}

export default function OverallStats({ analysis, excludedRepos, onClearExclusions }: OverallStatsProps) {
  const { t, locale } = useLocale();
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const { user, repos: allRepos } = analysis;

  const handleExportPng = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#111827" : "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${user.login}-repo-monitor.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [user.login]);

  // Filter out excluded repos and recalculate everything
  const activeRepos = useMemo(
    () => allRepos.filter((r) => !excludedRepos.has(r.name)),
    [allRepos, excludedRepos]
  );

  const { overallLanguages, totalBytes, totalRepos } = useMemo(() => {
    const langMap: Record<string, number> = {};
    let total = 0;
    for (const repo of activeRepos) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        langMap[lang] = (langMap[lang] || 0) + bytes;
        total += bytes;
      }
    }
    const langs = Object.entries(langMap)
      .map(([name, bytes]) => ({
        name,
        value: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
        bytes,
      }))
      .sort((a, b) => b.value - a.value);
    return { overallLanguages: langs, totalBytes: total, totalRepos: activeRepos.length };
  }, [activeRepos]);

  const repos = activeRepos;

  const pieData = overallLanguages.slice(0, 15);
  const barData = overallLanguages.slice(0, 20).map((l, i) => ({
    ...l,
    fill: getLanguageColor(l.name, i),
  }));

  // Compute extra insights
  const insights = useMemo(() => {
    if (repos.length === 0) return null;

    // Biggest & smallest repos by code
    const sortedBySize = [...repos].sort((a, b) => b.totalBytes - a.totalBytes);
    const biggestRepo = sortedBySize[0];
    const smallestRepo = sortedBySize[sortedBySize.length - 1];

    // Most starred
    const mostStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];

    // Most languages
    const mostLangs = [...repos].sort((a, b) => b.languagePercentages.length - a.languagePercentages.length)[0];

    // Average languages per repo
    const avgLangs = repos.reduce((sum, r) => sum + r.languagePercentages.length, 0) / repos.length;

    // Average repo size
    const avgSize = totalBytes / repos.length;

    // Newest & oldest repo
    const sortedByDate = [...repos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const newestRepo = sortedByDate[0];
    const oldestRepo = sortedByDate[sortedByDate.length - 1];

    // Most recently updated
    const mostRecent = [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

    // Most forked
    const mostForked = [...repos].sort((a, b) => b.forks_count - a.forks_count)[0];

    // Total stars
    const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Total forks
    const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

    // Dominant language (appears in most repos as the #1 lang)
    const dominantMap: Record<string, number> = {};
    repos.forEach(r => {
      if (r.languagePercentages.length > 0) {
        const top = r.languagePercentages[0].name;
        dominantMap[top] = (dominantMap[top] || 0) + 1;
      }
    });
    const dominantLang = Object.entries(dominantMap).sort((a, b) => b[1] - a[1])[0];

    return {
      biggestRepo, smallestRepo, mostStarred, mostLangs, avgLangs, avgSize,
      newestRepo, oldestRepo, mostRecent, mostForked, totalStars, totalForks,
      dominantLang,
    };
  }, [repos, totalBytes]);

  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  return (
    <div className="space-y-8">
      {/* Export PNG Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer disabled:opacity-50 border border-indigo-200 dark:border-indigo-800"
        >
          {exporting ? t("stats.exporting") : t("stats.export")}
        </button>
      </div>

      <div ref={exportRef} className="space-y-8">
      {/* User Profile Card */}
      <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Image
            src={user.avatar_url}
            alt={user.login}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">
              {user.name || user.login}
            </h1>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white transition-colors"
            >
              @{user.login}
            </a>
            {user.bio && (
              <p className="mt-2 text-white/90 max-w-xl">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-6 mt-4 justify-center md:justify-start">
              <div>
                <span className="text-2xl font-bold">{totalRepos}</span>
                <span className="text-white/70 ml-1 text-sm">{t("stats.repo")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{user.followers}</span>
                <span className="text-white/70 ml-1 text-sm">{t("stats.followers")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{user.following}</span>
                <span className="text-white/70 ml-1 text-sm">{t("stats.following")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {formatBytes(totalBytes)}
                </span>
                <span className="text-white/70 ml-1 text-sm">{t("stats.totalCode")}</span>
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {overallLanguages.length}
                </span>
                <span className="text-white/70 ml-1 text-sm">{t("stats.language")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusion Banner */}
      {excludedRepos.size > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">🔇</span>
            <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
              <span className="font-bold">{excludedRepos.size}</span> {t("exclusion.banner")}
              <span className="text-amber-500 dark:text-amber-400 ml-1">
                ({analysis.repos.length - excludedRepos.size}/{analysis.repos.length} {t("exclusion.active")})
              </span>
            </p>
          </div>
          <button
            onClick={onClearExclusions}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors font-medium cursor-pointer whitespace-nowrap"
          >
            {t("exclusion.includeAll")}
          </button>
        </div>
      )}

      {/* Overall Language Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          {t("stats.distribution.title")}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              {t("stats.pie.title")}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) =>
                    value > 2 ? `${name} ${value}%` : ""
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={getLanguageColor(entry.name, index)}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${formatBytes((props?.payload as { bytes: number })?.bytes ?? 0)})`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              {t("stats.bar.title")}
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(350, barData.length * 36)}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatBytes(v)}
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatBytes(Number(value)), "Boyut"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Bar dataKey="bytes" radius={[0, 6, 6, 0]} barSize={20} animationDuration={800}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={getLanguageColor(entry.name, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Legend Table */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
            {t("stats.table.title")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 px-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {t("stats.table.lang")}
                  </th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    {t("stats.table.percent")}
                  </th>
                  <th className="py-2 px-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    {t("stats.table.size")}
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-1/2">
                    {t("stats.table.ratio")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {overallLanguages.map((lang, i) => (
                  <tr
                    key={lang.name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block shrink-0"
                          style={{
                            backgroundColor: getLanguageColor(lang.name, i),
                          }}
                        />
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {lang.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      %{lang.value}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {formatBytes(lang.bytes)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(lang.value, 0.5)}%`,
                            backgroundColor: getLanguageColor(lang.name, i),
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            {t("insights.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dominant Language */}
            {insights.dominantLang && (
              <InsightCard
                icon="👑"
                label={t("insights.favLang")}
                value={insights.dominantLang[0]}
                detail={`${insights.dominantLang[1]} ${t("insights.favLangDetail")}`}
                color={getLanguageColor(insights.dominantLang[0], 0)}
              />
            )}

            {/* Avg languages per repo */}
            <InsightCard
              icon="📐"
              label={t("insights.avgLang")}
              value={insights.avgLangs.toFixed(1)}
              detail={t("insights.avgLangDetail")}
            />

            {/* Avg size */}
            <InsightCard
              icon="📊"
              label={t("insights.avgSize")}
              value={formatBytes(insights.avgSize)}
              detail={t("insights.codeSize")}
            />

            {/* Total stars */}
            <InsightCard
              icon="⭐"
              label={t("insights.totalStars")}
              value={String(insights.totalStars)}
              detail={`${t("insights.mostStarred")}: ${insights.mostStarred.name} (${insights.mostStarred.stargazers_count})`}
            />

            {/* Total forks */}
            <InsightCard
              icon="🍴"
              label={t("insights.totalForks")}
              value={String(insights.totalForks)}
              detail={insights.mostForked.forks_count > 0
                ? `${t("insights.mostStarred")}: ${insights.mostForked.name} (${insights.mostForked.forks_count})`
                : t("insights.noFork")}
            />

            {/* Biggest repo */}
            <InsightCard
              icon="🏋️"
              label={t("insights.biggestRepo")}
              value={insights.biggestRepo.name}
              detail={formatBytes(insights.biggestRepo.totalBytes)}
            />

            {/* Most languages */}
            <InsightCard
              icon="🌐"
              label={t("insights.mostLangs")}
              value={insights.mostLangs.name}
              detail={`${insights.mostLangs.languagePercentages.length} ${t("insights.differentLangs")}`}
            />

            {/* Newest repo */}
            <InsightCard
              icon="🆕"
              label={t("insights.newestRepo")}
              value={insights.newestRepo.name}
              detail={new Date(insights.newestRepo.created_at).toLocaleDateString(dateLocale)}
            />

            {/* Oldest repo */}
            <InsightCard
              icon="📜"
              label={t("insights.oldestRepo")}
              value={insights.oldestRepo.name}
              detail={new Date(insights.oldestRepo.created_at).toLocaleDateString(dateLocale)}
            />

            {/* Most recently updated */}
            <InsightCard
              icon="🔄"
              label={t("insights.lastUpdated")}
              value={insights.mostRecent.name}
              detail={new Date(insights.mostRecent.updated_at).toLocaleDateString(dateLocale)}
            />

            {/* Total languages */}
            <InsightCard
              icon="🗂️"
              label={t("insights.totalLangs")}
              value={String(overallLanguages.length)}
              detail={t("insights.differentProgLangs")}
            />

            {/* Smallest repo */}
            <InsightCard
              icon="🔬"
              label={t("insights.smallestRepo")}
              value={insights.smallestRepo.name}
              detail={formatBytes(insights.smallestRepo.totalBytes)}
            />
          </div>
        </div>
      )}
      </div>{/* end exportRef */}
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </p>
          <p
            className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate mt-0.5"
            style={color ? { color } : undefined}
          >
            {value}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
