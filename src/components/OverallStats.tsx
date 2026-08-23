"use client";

import { getLanguageColor, formatBytes } from "@/lib/utils";
import { UserAnalysis } from "@/lib/github";
import { useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import GitHubAvatar from "@/components/GitHubAvatar";
import { useLocale } from "@/components/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";
import SegmentBar from "@/components/SegmentBar";

interface OverallStatsProps {
  analysis: UserAnalysis;
  excludedRepos: Set<string>;
  onClearExclusions: () => void;
}

const TILE = "rounded-2xl border border-hairline bg-surface";

function Tile({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`${TILE} ${className}`}>{children}</div>;
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Tile className="p-4">
      <div className={`text-2xl font-semibold tnum leading-none ${accent ?? "text-fg"}`}>{value}</div>
      <div className="text-xs text-faint mt-2">{label}</div>
    </Tile>
  );
}

function InsightTile({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return (
    <Tile className="p-4">
      <div className="text-[11px] font-medium text-faint uppercase tracking-wide truncate">{label}</div>
      <div className="text-[15px] font-semibold text-fg truncate mt-1.5" style={color ? { color } : undefined}>{value}</div>
      <div className="text-xs text-faint truncate mt-1">{detail}</div>
    </Tile>
  );
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
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff",
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

  const activeRepos = useMemo(
    () => allRepos.filter((r) => !excludedRepos.has(r.name)),
    [allRepos, excludedRepos]
  );

  const { overallLanguages, totalBytes } = useMemo(() => {
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
    return { overallLanguages: langs, totalBytes: total };
  }, [activeRepos]);

  const repos = activeRepos;

  const insights = useMemo(() => {
    if (repos.length === 0) return null;
    const sortedBySize = [...repos].sort((a, b) => b.totalBytes - a.totalBytes);
    const biggestRepo = sortedBySize[0];
    const smallestRepo = sortedBySize[sortedBySize.length - 1];
    const mostStarred = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    const mostLangs = [...repos].sort((a, b) => b.languagePercentages.length - a.languagePercentages.length)[0];
    const avgLangs = repos.reduce((s, r) => s + r.languagePercentages.length, 0) / repos.length;
    const avgSize = totalBytes / repos.length;
    const sortedByDate = [...repos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const newestRepo = sortedByDate[0];
    const oldestRepo = sortedByDate[sortedByDate.length - 1];
    const mostRecent = [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
    const mostForked = [...repos].sort((a, b) => b.forks_count - a.forks_count)[0];
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
    const dominantMap: Record<string, number> = {};
    repos.forEach((r) => {
      if (r.languagePercentages.length > 0) {
        const top = r.languagePercentages[0].name;
        dominantMap[top] = (dominantMap[top] || 0) + 1;
      }
    });
    const dominantLang = Object.entries(dominantMap).sort((a, b) => b[1] - a[1])[0];
    return { biggestRepo, smallestRepo, mostStarred, mostLangs, avgLangs, avgSize, newestRepo, oldestRepo, mostRecent, mostForked, totalStars, totalForks, dominantLang };
  }, [repos, totalBytes]);

  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" });
  const tl = (k: string) => t(k as TranslationKey);

  return (
    <div className="space-y-3">
      {/* Exclusion banner */}
      {excludedRepos.size > 0 && (
        <Tile className="p-3 bg-warning-soft flex items-center justify-between gap-3">
          <p className="text-warning text-sm font-medium">
            {excludedRepos.size} {t("exclusion.banner")}{" "}
            <span className="text-faint">({allRepos.length - excludedRepos.size}/{allRepos.length} {t("exclusion.active")})</span>
          </p>
          <button onClick={onClearExclusions} className="text-xs px-3 py-1.5 rounded-lg border border-hairline text-muted hover:text-fg hover:bg-surface transition-colors cursor-pointer whitespace-nowrap">
            {t("exclusion.includeAll")}
          </button>
        </Tile>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-hairline text-muted text-sm font-medium hover:text-fg hover:bg-panel transition-colors cursor-pointer disabled:opacity-50"
        >
          {exporting ? t("stats.exporting") : t("stats.export")}
        </button>
      </div>

      <div ref={exportRef} className="space-y-3">
        {/* Profile hero tile */}
        <Tile className="p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex items-start gap-4 sm:w-1/2 min-w-0">
              <GitHubAvatar src={user.avatar_url} alt={user.login} identity={user.login} width={64} height={64} className="w-16 h-16 rounded-2xl shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-fg truncate">{user.name || user.login}</h1>
                <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-accent-text transition-colors">@{user.login}</a>
                {user.bio && <p className="mt-2 text-sm text-muted line-clamp-3">{user.bio}</p>}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center justify-between text-xs text-faint mb-2">
                <span>{t("stats.distribution.title")}</span>
                <span className="tnum">{overallLanguages.length} {t("stats.language")}</span>
              </div>
              <SegmentBar segments={overallLanguages} height={14} />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {overallLanguages.slice(0, 5).map((l, i) => (
                  <span key={l.name} className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ background: getLanguageColor(l.name, i) }} />
                    {l.name} <span className="text-faint tnum">{l.value}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Tile>

        {/* Metric tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricTile label={t("metric.repoCount")} value={repos.length.toLocaleString()} />
          <MetricTile label={t("metric.totalStars")} value={(insights?.totalStars ?? 0).toLocaleString()} accent="text-fg" />
          <MetricTile label={t("metric.totalForks")} value={(insights?.totalForks ?? 0).toLocaleString()} />
          <MetricTile label={t("metric.totalBytes")} value={formatBytes(totalBytes)} />
          <MetricTile label={t("stats.followers")} value={user.followers.toLocaleString()} />
          <MetricTile label={t("stats.following")} value={user.following.toLocaleString()} />
          <MetricTile label={t("stats.language")} value={String(overallLanguages.length)} />
          <MetricTile label={t("insights.avgSize")} value={formatBytes(insights?.avgSize ?? 0)} />
        </div>

        {/* Languages module: ranked list with chunky bars */}
        {overallLanguages.length > 0 && (
          <Tile className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-fg">{t("stats.distribution.title")}</h2>
              <span className="text-xs text-faint tnum">{overallLanguages.length} {t("stats.language")}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
              {overallLanguages.map((l, i) => (
                <div key={l.name} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getLanguageColor(l.name, i) }} />
                  <span className="text-fg w-24 truncate">{l.name}</span>
                  <div className="flex-1 h-2.5 bg-panel rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(l.value, 1)}%`, background: getLanguageColor(l.name, i) }} />
                  </div>
                  <span className="tnum text-xs text-muted w-11 text-right">{l.value}%</span>
                  <span className="tnum text-xs text-faint w-14 text-right">{formatBytes(l.bytes)}</span>
                </div>
              ))}
            </div>
          </Tile>
        )}

        {/* Insights bento */}
        {insights && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {insights.dominantLang && (
              <InsightTile label={tl("insights.favLang")} value={insights.dominantLang[0]} detail={`${insights.dominantLang[1]} ${tl("insights.favLangDetail")}`} color={getLanguageColor(insights.dominantLang[0], 0)} />
            )}
            <InsightTile label={tl("insights.avgLang")} value={insights.avgLangs.toFixed(1)} detail={tl("insights.avgLangDetail")} />
            <InsightTile label={tl("insights.biggestRepo")} value={insights.biggestRepo.name} detail={formatBytes(insights.biggestRepo.totalBytes)} />
            <InsightTile label={tl("insights.mostStarred")} value={insights.mostStarred.name} detail={`★ ${insights.mostStarred.stargazers_count}`} />
            <InsightTile label={tl("insights.mostLangs")} value={insights.mostLangs.name} detail={`${insights.mostLangs.languagePercentages.length} ${tl("insights.differentLangs")}`} />
            <InsightTile label={tl("insights.newestRepo")} value={insights.newestRepo.name} detail={fmtDate(insights.newestRepo.created_at)} />
            <InsightTile label={tl("insights.oldestRepo")} value={insights.oldestRepo.name} detail={fmtDate(insights.oldestRepo.created_at)} />
            <InsightTile label={tl("insights.lastUpdated")} value={insights.mostRecent.name} detail={fmtDate(insights.mostRecent.updated_at)} />
            <InsightTile label={tl("insights.smallestRepo")} value={insights.smallestRepo.name} detail={formatBytes(insights.smallestRepo.totalBytes)} />
          </div>
        )}
      </div>
    </div>
  );
}
