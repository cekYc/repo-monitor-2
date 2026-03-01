"use client";

import { UserAnalysis } from "@/lib/github";
import { getLanguageColor, formatBytes } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";
import Image from "next/image";
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {t("compare.title")}
      </h2>

      {/* Side by side summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[userA, userB].map((analysis, idx) => {
          const stars = idx === 0 ? starsA : starsB;
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
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
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
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{analysis.totalRepos}</p>
                  <p className="text-xs text-gray-500">{t("compare.totalRepos")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatBytes(analysis.totalBytes)}</p>
                  <p className="text-xs text-gray-500">{t("compare.totalCode")}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stars}</p>
                  <p className="text-xs text-gray-500">{t("compare.totalStars")}</p>
                </div>
              </div>
            </div>
          );
        })}
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
