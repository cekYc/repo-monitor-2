"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

interface ProjectLeaderboardProps {
  repos: RepoInfo[];
}

function getScoreGrade(score: number) {
  if (score >= 80) return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  if (score >= 60) return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
  if (score >= 40) return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
  return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
}

function getRankBadge(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

export default function ProjectLeaderboard({ repos }: ProjectLeaderboardProps) {
  const { t } = useLocale();
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedRepos = useMemo(() => {
    return [...repos]
      .filter((r) => r.advancedMetrics !== undefined)
      .sort((a, b) => (b.advancedMetrics?.projectScore || 0) - (a.advancedMetrics?.projectScore || 0));
  }, [repos]);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      
      const scrollDiv = containerRef.current.querySelector('[data-scroll-container]') as HTMLElement;
      const originalMaxHeight = scrollDiv ? scrollDiv.style.maxHeight : '';
      const originalOverflow = scrollDiv ? scrollDiv.style.overflowY : '';
      
      if (scrollDiv) {
        scrollDiv.style.maxHeight = 'none';
        scrollDiv.style.overflowY = 'visible';
      }

      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff",
        pixelRatio: 2,
      });

      if (scrollDiv) {
        scrollDiv.style.maxHeight = originalMaxHeight;
        scrollDiv.style.overflowY = originalOverflow;
      }

      const link = document.createElement("a");
      link.download = `project-scoreboard-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Leaderboard export failed:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  if (sortedRepos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5" ref={containerRef}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-fg flex items-center gap-2">
            {t("leaderboard.title")}
            <span className="text-xs font-normal text-faint tnum">({sortedRepos.length})</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">{t("leaderboard.desc")}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-accent-soft text-accent-text hover:bg-accent-soft/70 transition-colors cursor-pointer disabled:opacity-50 font-medium"
        >
          {exporting ? t("timeline.exporting") : t("timeline.export")}
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 pb-2 mb-2 border-b border-hairline text-xs font-semibold text-muted">
        <div className="col-span-1 text-center">{t("leaderboard.rank")}</div>
        <div className="col-span-4 sm:col-span-3 truncate">{t("leaderboard.repo")}</div>
        <div className="col-span-3 sm:col-span-3 text-center">{t("leaderboard.score")}</div>
        <div className="col-span-2 sm:col-span-2 text-center truncate">{t("leaderboard.density")}</div>
        <div className="hidden sm:block sm:col-span-3 text-right truncate">{t("leaderboard.activeDays")}</div>
      </div>

      {/* Rows */}
      <div className="max-h-96 overflow-y-auto space-y-1 pr-1" data-scroll-container>
        {sortedRepos.map((repo, idx) => {
          const m = repo.advancedMetrics!;
          const score = Math.round(m.projectScore);
          const densityPct = Math.round(m.developmentDensity * 100);
          const grade = getScoreGrade(score);

          return (
            <div
              key={repo.name}
              className="grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-xl hover:bg-panel/50 transition-colors border border-transparent hover:border-hairline"
            >
              {/* Rank */}
              <div className="col-span-1 text-center font-bold text-sm tnum">
                {getRankBadge(idx)}
              </div>

              {/* Repo Name */}
              <div className="col-span-4 sm:col-span-3 min-w-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-fg hover:text-accent truncate block"
                  title={repo.description || repo.name}
                >
                  {repo.name}
                </a>
                {m.lastMaintenance && (
                  <span className="text-[10px] text-faint block truncate">
                    {t("leaderboard.lastUpdate")}: {formatDate(m.lastMaintenance)}
                  </span>
                )}
              </div>

              {/* Score Badge & Progress Bar */}
              <div className="col-span-3 sm:col-span-3 flex items-center justify-center gap-2">
                <div className="hidden md:block w-16 bg-panel rounded-full h-1.5 shrink-0">
                  <div className={`h-1.5 rounded-full ${grade.bg}`} style={{ width: `${Math.min(100, score)}%` }} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${grade.badge} tnum`}>
                  {score} / 100
                </span>
              </div>

              {/* Development Density */}
              <div className="col-span-2 sm:col-span-2 text-center font-medium text-xs text-fg tnum">
                %{densityPct}
              </div>

              {/* Active / Total Days */}
              <div className="col-span-2 sm:col-span-3 text-right font-mono text-xs text-muted truncate tnum" title={`${m.activeDays} aktif gün / ${m.totalDurationDays} toplam gün`}>
                <span className="text-fg font-semibold">{m.activeDays}</span> / {m.totalDurationDays} {t("timeline.days")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
