"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useLocale } from "@/components/LocaleProvider";
import { getLanguageColor, formatBytes, formatDate } from "@/lib/utils";
import type { RepoDeepAnalysis } from "@/lib/github";
import type { TranslationKey } from "@/lib/i18n";
import WatchButton from "@/components/WatchButton";

interface RepoDeepDiveProps {
  data: RepoDeepAnalysis;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="bg-panel rounded-xl p-4 text-center">
      <div className={`text-2xl font-semibold tnum ${accent ?? "text-fg"}`}>
        {value}
      </div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export default function RepoDeepDive({ data }: RepoDeepDiveProps) {
  const { t } = useLocale();

  const dowLabels = [0, 1, 2, 3, 4, 5, 6].map((d) =>
    t(`deep.dow.${d}` as TranslationKey)
  );

  const weekdayData = data.commitsByWeekday.map((count, i) => ({
    label: dowLabels[i],
    count,
  }));
  const hourData = data.commitsByHour.map((count, i) => ({
    label: String(i).padStart(2, "0"),
    count,
  }));
  const dailyData = data.commitActivity.map((d) => ({
    label: d.date.substring(5), // MM-DD
    count: d.count,
  }));

  const maxContrib = data.contributors[0]?.contributions ?? 1;
  const busFactorLow = data.busFactor > 0 && data.busFactor <= 2;

  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    fontSize: "12px",
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-hairline p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={data.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
              >
                {data.fullName}
              </a>
              {data.isArchived && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                  {t("deep.archived")}
                </span>
              )}
            </div>
            {data.description && (
              <p className="text-muted mt-2 max-w-2xl">
                {data.description}
              </p>
            )}
            {data.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.topics.slice(0, 10).map((topic) => (
                  <span
                    key={topic}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
          <WatchButton type="repo" label={data.fullName} />
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={`⭐ ${t("metric.stars")}`} value={data.stars.toLocaleString()} accent="text-amber-500" />
        <StatCard label={`🍴 ${t("metric.forks")}`} value={data.forks.toLocaleString()} />
        <StatCard label={`👁️ ${t("metric.watchers")}`} value={data.watchers.toLocaleString()} />
        <StatCard label={`👥 ${t("metric.contributorCount")}`} value={data.contributorCount.toLocaleString()} />
        <StatCard label={`🐛 ${t("metric.openIssues")}`} value={data.openIssues.toLocaleString()} accent="text-rose-500" />
        <StatCard label={`🔀 ${t("metric.openPRs")}`} value={data.openPRs.toLocaleString()} accent="text-emerald-500" />
        <StatCard label={`🚀 ${t("metric.releaseCount")}`} value={data.releaseCount.toLocaleString()} />
        <StatCard label={`📦 ${t("metric.totalBytes")}`} value={formatBytes(data.totalBytes)} />
      </div>

      {/* Bus factor */}
      <div
        className={`rounded-2xl border p-6 ${
          busFactorLow
            ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
            : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
        }`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`text-5xl font-black ${busFactorLow ? "text-rose-500" : "text-emerald-500"}`}>
            {data.busFactor}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-fg flex items-center gap-2">
              🚌 {t("deep.busFactor")}
              <span className="text-xs font-normal text-muted">
                ({data.busFactorPct}% {t("deep.ofCommits")})
              </span>
            </div>
            <p className="text-sm text-muted mt-0.5">
              {t("deep.busFactorDesc")}
            </p>
            <p className={`text-sm font-medium mt-1 ${busFactorLow ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {busFactorLow ? `⚠️ ${t("deep.busFactorWarn")}` : `✅ ${t("deep.busFactorGood")}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages */}
        <div className="bg-surface rounded-2xl border border-hairline p-6">
          <h3 className="font-bold text-fg mb-4">{t("deep.languages")}</h3>
          {data.languages.length > 0 ? (
            <>
              <div className="flex rounded-full overflow-hidden h-3 bg-panel">
                {data.languages.map((lang, i) => (
                  <div
                    key={lang.name}
                    title={`${lang.name}: ${lang.value}%`}
                    className="h-full"
                    style={{
                      width: `${Math.max(lang.value, 0.3)}%`,
                      backgroundColor: getLanguageColor(lang.name, i),
                    }}
                  />
                ))}
              </div>
              <div className="space-y-1.5 mt-4">
                {data.languages.slice(0, 8).map((lang, i) => (
                  <div key={lang.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: getLanguageColor(lang.name, i) }}
                    />
                    <span className="font-medium text-fg w-28 truncate">
                      {lang.name}
                    </span>
                    <div className="flex-1 bg-panel rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.max(lang.value, 0.5)}%`,
                          backgroundColor: getLanguageColor(lang.name, i),
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted w-12 text-right">%{lang.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-faint italic">{t("deep.noReleases")}</p>
          )}
        </div>

        {/* Contributors */}
        <div className="bg-surface rounded-2xl border border-hairline p-6">
          <h3 className="font-bold text-fg mb-4">
            {t("deep.contributors")}
            <span className="text-xs font-normal text-faint ml-2">{data.contributorCount}</span>
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {data.contributors.map((c) => (
              <a
                key={c.login}
                href={c.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.avatar_url} alt={c.login} className="w-7 h-7 rounded-full shrink-0" />
                <span className="text-sm font-medium text-fg w-32 truncate group-hover:text-indigo-500">
                  {c.login}
                </span>
                <div className="flex-1 bg-panel rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-accent"
                    style={{ width: `${(c.contributions / maxContrib) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted w-12 text-right">
                  {c.contributions.toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Commit cadence */}
      <div className="bg-surface rounded-2xl border border-hairline p-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
          <h3 className="font-bold text-fg">{t("deep.commitCadence")}</h3>
          <span className="text-xs text-faint">
            {data.recentCommits} {t("deep.commitsAnalyzed")}
            {data.windowDays > 0 && ` · ${data.windowDays} ${t("deep.days")}`}
          </span>
        </div>

        {/* Recent daily activity */}
        {dailyData.length > 1 && (
          <div className="mb-6">
            <p className="text-xs text-muted mb-2">{t("deep.recentActivity")}</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={dailyData}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted mb-2">{t("deep.byWeekday")}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weekdayData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(139,92,246,0.08)" }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {weekdayData.map((d, i) => (
                    <Cell key={i} fill={i === 0 || i === 6 ? "#a855f7" : "#8b5cf6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-muted mb-2">{t("deep.byHour")}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={hourData}>
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9ca3af" }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(236,72,153,0.08)" }} />
                <Bar dataKey="count" fill="#ec4899" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Releases + Hygiene */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-hairline p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-bold text-fg">{t("deep.releases")}</h3>
            <span className="text-xs text-faint">{data.releaseCount} {t("deep.totalReleases")}</span>
          </div>
          {data.releases.length > 0 ? (
            <ol className="relative border-l border-hairline-strong ml-2 space-y-4">
              {data.releases.map((r) => (
                <li key={r.tag} className="ml-4">
                  <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-[5px] mt-1.5" />
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {r.tag}
                  </a>
                  {r.name && r.name !== r.tag && (
                    <span className="text-sm text-muted ml-2">{r.name}</span>
                  )}
                  {r.publishedAt && (
                    <div className="text-xs text-faint mt-0.5">{formatDate(r.publishedAt)}</div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-faint italic">{t("deep.noReleases")}</p>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-hairline p-6">
          <h3 className="font-bold text-fg mb-4">{t("deep.hygiene")}</h3>
          <div className="space-y-3">
            <HygieneRow label={t("deep.readme")} ok={data.hasReadme} />
            <HygieneRow label={t("deep.ci")} ok={data.hasCI} />
            <HygieneRow label={t("deep.license")} ok={!!data.license} detail={data.license ?? undefined} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-hairline text-sm">
            <div>
              <div className="text-xs text-faint">{t("deep.created")}</div>
              <div className="text-fg">{data.createdAt ? formatDate(data.createdAt) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-faint">{t("deep.lastCommit")}</div>
              <div className="text-fg">
                {data.lastCommitDate ? formatDate(data.lastCommitDate) : "—"}
              </div>
            </div>
          </div>
          {data.homepage && (
            <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="block mt-3 text-sm text-indigo-500 hover:underline truncate">
              🔗 {data.homepage}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function HygieneRow({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-fg">{label}</span>
      <span className={`text-sm font-medium ${ok ? "text-emerald-500" : "text-faint"}`}>
        {ok ? `✓ ${detail ?? ""}`.trim() : "✗"}
      </span>
    </div>
  );
}
