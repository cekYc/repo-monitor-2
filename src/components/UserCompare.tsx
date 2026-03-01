"use client";

import { UserAnalysis } from "@/lib/github";
import { getLanguageColor, formatBytes } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";
import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserCompareProps {
  userA: UserAnalysis;
  userB: UserAnalysis;
}

export default function UserCompare({ userA, userB }: UserCompareProps) {
  const { t } = useLocale();
  const compareRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPng = useCallback(async () => {
    if (!compareRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(compareRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#111827" : "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `compare-${userA.user.login}-vs-${userB.user.login}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Compare PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [userA.user.login, userB.user.login]);

  // Compute shared and unique languages
  const langsA = new Set(userA.overallLanguages.map((l) => l.name));
  const langsB = new Set(userB.overallLanguages.map((l) => l.name));

  const shared = [...langsA].filter((l) => langsB.has(l));
  const uniqueA = [...langsA].filter((l) => !langsB.has(l));
  const uniqueB = [...langsB].filter((l) => !langsA.has(l));

  // Build comparison chart data (top 15 shared languages)
  const allLangs = new Set([...langsA, ...langsB]);
  const chartData = [...allLangs]
    .map((lang) => {
      const a = userA.overallLanguages.find((l) => l.name === lang);
      const b = userB.overallLanguages.find((l) => l.name === lang);
      return {
        name: lang,
        [userA.user.login]: a?.value ?? 0,
        [userB.user.login]: b?.value ?? 0,
      };
    })
    .sort(
      (x, y) =>
        Math.max(y[userA.user.login] as number, y[userB.user.login] as number) -
        Math.max(x[userA.user.login] as number, x[userB.user.login] as number)
    )
    .slice(0, 15);

  const starsA = userA.repos.reduce((s, r) => s + r.stargazers_count, 0);
  const starsB = userB.repos.reduce((s, r) => s + r.stargazers_count, 0);
  const forksA = userA.repos.reduce((s, r) => s + r.forks_count, 0);
  const forksB = userB.repos.reduce((s, r) => s + r.forks_count, 0);
  const avgSizeA = userA.totalRepos > 0 ? userA.totalBytes / userA.totalRepos : 0;
  const avgSizeB = userB.totalRepos > 0 ? userB.totalBytes / userB.totalRepos : 0;
  const topLangA = userA.overallLanguages[0]?.name ?? "—";
  const topLangB = userB.overallLanguages[0]?.name ?? "—";
  const langCountA = userA.overallLanguages.length;
  const langCountB = userB.overallLanguages.length;

  // Head-to-head metrics
  const metrics: { label: string; valA: number; valB: number; fmtA: string; fmtB: string }[] = [
    { label: t("compare.totalRepos"), valA: userA.totalRepos, valB: userB.totalRepos, fmtA: String(userA.totalRepos), fmtB: String(userB.totalRepos) },
    { label: t("compare.totalCode"), valA: userA.totalBytes, valB: userB.totalBytes, fmtA: formatBytes(userA.totalBytes), fmtB: formatBytes(userB.totalBytes) },
    { label: t("compare.totalStars"), valA: starsA, valB: starsB, fmtA: String(starsA), fmtB: String(starsB) },
    { label: t("compare.forks"), valA: forksA, valB: forksB, fmtA: String(forksA), fmtB: String(forksB) },
    { label: t("compare.languageCount"), valA: langCountA, valB: langCountB, fmtA: String(langCountA), fmtB: String(langCountB) },
    { label: t("compare.avgRepoSize"), valA: avgSizeA, valB: avgSizeB, fmtA: formatBytes(avgSizeA), fmtB: formatBytes(avgSizeB) },
  ];

  // Count wins
  let winsA = 0, winsB = 0;
  metrics.forEach((m) => { if (m.valA > m.valB) winsA++; else if (m.valB > m.valA) winsB++; });

  return (
    <div className="space-y-6" ref={compareRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("compare.title")}
        </h2>
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer disabled:opacity-50 font-medium"
        >
          {exporting ? "..." : t("compare.exportPng")}
        </button>
      </div>

      {/* Side by side summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[userA, userB].map((analysis, idx) => {
          const stars = idx === 0 ? starsA : starsB;
          const forks = idx === 0 ? forksA : forksB;
          const topLang = idx === 0 ? topLangA : topLangB;
          const wins = idx === 0 ? winsA : winsB;
          return (
            <div
              key={analysis.user.login}
              className={`rounded-2xl p-5 border ${
                idx === 0
                  ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                  : "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={analysis.user.avatar_url}
                  alt={analysis.user.login}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 dark:text-gray-100 truncate">
                    {analysis.user.name || analysis.user.login}
                  </p>
                  <a
                    href={analysis.user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    @{analysis.user.login}
                  </a>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  wins > (idx === 0 ? winsB : winsA)
                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                    : wins === (idx === 0 ? winsB : winsA)
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}>
                  {wins > (idx === 0 ? winsB : winsA) ? `🏆 ${t("compare.winner")}` : wins === (idx === 0 ? winsB : winsA) ? t("compare.tie") : ""}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{analysis.totalRepos}</p>
                  <p className="text-xs text-gray-500">{t("compare.totalRepos")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stars}</p>
                  <p className="text-xs text-gray-500">{t("compare.totalStars")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{forks}</p>
                  <p className="text-xs text-gray-500">{t("compare.forks")}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{t("compare.topLang")}: <strong className="text-gray-700 dark:text-gray-300">{topLang}</strong></span>
                <span>{t("compare.totalCode")}: <strong className="text-gray-700 dark:text-gray-300">{formatBytes(analysis.totalBytes)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Head-to-Head Metric Bars */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
          ⚔️ Head-to-Head
        </h3>
        <div className="space-y-3">
          {metrics.map((m) => {
            const total = m.valA + m.valB;
            const pctA = total > 0 ? (m.valA / total) * 100 : 50;
            const winnerA = m.valA > m.valB;
            const winnerB = m.valB > m.valA;
            return (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-mono ${winnerA ? "font-bold text-indigo-600 dark:text-indigo-400" : "text-gray-500"}`}>
                    {m.fmtA}
                  </span>
                  <span className="text-gray-400 text-[10px]">{m.label}</span>
                  <span className={`font-mono ${winnerB ? "font-bold text-purple-600 dark:text-purple-400" : "text-gray-500"}`}>
                    {m.fmtB}
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <div
                    className="bg-indigo-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${pctA}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500 rounded-r-full"
                    style={{ width: `${100 - pctA}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared & Unique Languages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shared */}
        <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">
            🤝 {t("compare.sharedLangs")} ({shared.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {shared.map((lang, i) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 text-gray-700 dark:text-gray-300"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: getLanguageColor(lang, i) }}
                />
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Unique to A */}
        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2">
            🔹 {userA.user.login} {t("compare.uniqueLangs")} ({uniqueA.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {uniqueA.length === 0 ? (
              <span className="text-xs text-gray-400">—</span>
            ) : (
              uniqueA.map((lang, i) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 text-gray-700 dark:text-gray-300"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: getLanguageColor(lang, i) }}
                  />
                  {lang}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Unique to B */}
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2">
            🔸 {userB.user.login} {t("compare.uniqueLangs")} ({uniqueB.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {uniqueB.length === 0 ? (
              <span className="text-xs text-gray-400">—</span>
            ) : (
              uniqueB.map((lang, i) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-gray-700 dark:text-gray-300"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: getLanguageColor(lang, i) }}
                  />
                  {lang}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comparison Bar Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
          {t("compare.langDistribution")}
        </h3>
        <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
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
              formatter={(value) => [`${value}%`, ""]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            />
            <Legend />
            <Bar
              dataKey={userA.user.login}
              fill="#6366f1"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
            <Bar
              dataKey={userB.user.login}
              fill="#a855f7"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
