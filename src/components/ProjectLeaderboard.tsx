"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

interface ProjectLeaderboardProps {
  repos: RepoInfo[];
}

type TierKey = "S" | "A" | "B" | "C" | "ALL";
type SortField = "score" | "name" | "density" | "activeDays";

function getTier(score: number): "S" | "A" | "B" | "C" {
  if (score >= 80) return "S";
  if (score >= 60) return "A";
  if (score >= 40) return "B";
  return "C";
}

function getTierConfig(tier: "S" | "A" | "B" | "C", t: (k: any) => string) {
  switch (tier) {
    case "S":
      return {
        label: t("leaderboard.tierS"),
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold",
        bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
        summary: "🏆 Uzun soluklu efor, vitrin kalitesi ve yoğun odakla taçlandırılmış portföy başyapıtı.",
      };
    case "A":
      return {
        label: t("leaderboard.tierA"),
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold",
        bar: "bg-emerald-500",
        summary: "🚀 Ciddi bir mesai ve özenle geliştirilmiş asli projelerinizden biri.",
      };
    case "B":
      return {
        label: t("leaderboard.tierB"),
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-medium",
        bar: "bg-blue-500",
        summary: "🛠️ Belirli bir ihtiyacı karşılayan veya orta vadeli çalışma harcanan standart proje.",
      };
    case "C":
    default:
      return {
        label: t("leaderboard.tierC"),
        badge: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 text-xs",
        bar: "bg-slate-400 dark:bg-slate-600",
        summary: "🧪 Kısa sürede tamamlanıp bırakılmış, test, konsept veya deneme/karalama çalışması.",
      };
  }
}

function getRankBadge(index: number, pageSort: SortField, asc: boolean) {
  if (pageSort !== "score" || asc) return `#${index + 1}`;
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

export default function ProjectLeaderboard({ repos }: ProjectLeaderboardProps) {
  const { t } = useLocale();
  const [exporting, setExporting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierKey>("ALL");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSortedRepos = useMemo(() => {
    return repos
      .filter((r) => r.advancedMetrics !== undefined)
      .filter((r) => {
        if (selectedTier === "ALL") return true;
        return getTier(Math.round(r.advancedMetrics!.projectScore)) === selectedTier;
      })
      .sort((a, b) => {
        const mA = a.advancedMetrics!;
        const mB = b.advancedMetrics!;
        let valA = 0;
        let valB = 0;

        if (sortField === "score") {
          valA = mA.projectScore;
          valB = mB.projectScore;
        } else if (sortField === "density") {
          valA = mA.developmentDensity;
          valB = mB.developmentDensity;
        } else if (sortField === "activeDays") {
          valA = mA.activeDays;
          valB = mB.activeDays;
        } else if (sortField === "name") {
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [repos, selectedTier, sortField, sortAsc]);

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
      link.download = `prestige-scoreboard-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Leaderboard export failed:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  if (repos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 transition-all shadow-sm" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-hairline">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            {t("leaderboard.title")}
            <span className="text-xs font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-full tnum">
              {filteredAndSortedRepos.length} / {repos.length}
            </span>
          </h2>
          <p className="text-xs text-muted mt-1 max-w-xl">{t("leaderboard.desc")}</p>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-panel p-1 rounded-xl border border-hairline gap-1">
            {(["ALL", "S", "A", "B", "C"] as TierKey[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedTier === tier
                    ? "bg-surface text-fg shadow-sm border border-hairline"
                    : "text-muted hover:text-fg"
                }`}
              >
                {tier === "ALL" ? "Tümü" : `Tier ${tier}`}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0 text-xs px-3 py-2 rounded-xl bg-accent text-accent-fg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 font-semibold shadow-sm"
          >
            {exporting ? t("timeline.exporting") : t("timeline.export")}
          </button>
        </div>
      </div>

      {/* Table Column Headers - Interactive Sorting */}
      <div className="grid grid-cols-12 gap-2 pb-2 mb-2 px-2 text-xs font-bold text-faint select-none">
        <div className="col-span-1 text-center">{t("leaderboard.rank")}</div>
        <div className="col-span-4 sm:col-span-4 cursor-pointer hover:text-fg transition-colors flex items-center gap-1" onClick={() => toggleSort("name")}>
          {t("leaderboard.repo")} {sortField === "name" && (sortAsc ? "▲" : "▼")}
        </div>
        <div className="col-span-3 sm:col-span-3 text-center cursor-pointer hover:text-fg transition-colors flex items-center justify-center gap-1" onClick={() => toggleSort("score")}>
          {t("leaderboard.score")} {sortField === "score" && (sortAsc ? "▲" : "▼")}
        </div>
        <div className="col-span-2 sm:col-span-2 text-center cursor-pointer hover:text-fg transition-colors flex items-center justify-center gap-1" onClick={() => toggleSort("density")}>
          {t("leaderboard.density")} {sortField === "density" && (sortAsc ? "▲" : "▼")}
        </div>
        <div className="col-span-2 sm:col-span-2 text-right cursor-pointer hover:text-fg transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("activeDays")}>
          {t("leaderboard.activeDays")} {sortField === "activeDays" && (sortAsc ? "▲" : "▼")}
        </div>
      </div>

      {/* Rows Container */}
      <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1" data-scroll-container>
        {filteredAndSortedRepos.map((repo, idx) => {
          const m = repo.advancedMetrics!;
          const score = Math.round(m.projectScore);
          const densityPct = Math.round(m.developmentDensity * 100);
          const tier = getTier(score);
          const tierConfig = getTierConfig(tier, t as any);
          const isExpanded = expandedRepo === repo.name;
          const brk = m.scoreBreakdown || { effort: Math.round(score * 0.4), polish: Math.round(score * 0.25), focus: Math.round(score * 0.25), recency: Math.round(score * 0.1) };

          return (
            <div key={repo.name} className="flex flex-col">
              <div
                onClick={() => setExpandedRepo(isExpanded ? null : repo.name)}
                className={`grid grid-cols-12 gap-2 items-center py-2.5 px-2 rounded-xl cursor-pointer transition-all border ${
                  isExpanded
                    ? "bg-panel border-hairline shadow-inner"
                    : "hover:bg-panel/60 border-transparent hover:border-hairline"
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 text-center font-bold text-sm tnum">
                  {getRankBadge(idx, sortField, sortAsc)}
                </div>

                {/* Repo Name & Info */}
                <div className="col-span-4 sm:col-span-4 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-fg truncate hover:text-accent transition-colors" title={repo.description || repo.name}>
                      {repo.name}
                    </span>
                    {repo.stargazers_count > 0 && (
                      <span className="shrink-0 text-[11px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded">
                        ★ {repo.stargazers_count}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-faint truncate mt-0.5">
                    {repo.description || (m.lastMaintenance ? `${t("leaderboard.lastUpdate")}: ${formatDate(m.lastMaintenance)}` : "")}
                  </span>
                </div>

                {/* Score & Tier Badge */}
                <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 sm:w-16 bg-panel rounded-full h-1.5 shrink-0 border border-hairline overflow-hidden">
                      <div className={`h-full rounded-full ${tierConfig.bar}`} style={{ width: `${Math.min(100, score)}%` }} />
                    </div>
                    <span className="font-extrabold text-xs text-fg tnum">{score}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md ${tierConfig.badge}`}>
                    {tierConfig.label.split(":")[1] || tierConfig.label}
                  </span>
                </div>

                {/* Density */}
                <div className="col-span-2 sm:col-span-2 text-center font-bold text-xs text-muted tnum">
                  %{densityPct}
                </div>

                {/* Active / Total Days + Chevron */}
                <div className="col-span-2 sm:col-span-2 text-right flex items-center justify-end gap-1.5 font-mono text-xs text-muted tnum">
                  <div>
                    <span className="text-fg font-bold">{m.activeDays}</span>
                    <span className="hidden sm:inline"> / {m.totalDurationDays}</span>
                    <span className="text-[10px] ml-0.5 text-faint">g</span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-faint transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180 text-accent" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* X-Ray Score Breakdown Drawer */}
              {isExpanded && (
                <div className="mt-1 mb-2 mx-2 p-4 rounded-xl bg-surface border border-hairline-strong shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between border-b border-hairline pb-2 mb-3">
                    <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                      🔬 Detaylı Skor Röntgeni (Score X-Ray)
                    </span>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-accent font-semibold hover:underline flex items-center gap-1"
                    >
                      GitHub&apos;da Aç ↗
                    </a>
                  </div>

                  {/* 4 Pillars Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {/* Effort Pillar */}
                    <div className="bg-panel p-2.5 rounded-lg border border-hairline">
                      <div className="text-[11px] font-semibold text-muted mb-1">{t("leaderboard.effort")}</div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-fg tnum">{brk.effort}</span>
                        <span className="text-[10px] text-faint">/ 45</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(brk.effort / 45) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-faint mt-1.5">
                        {m.activeDays} aktif gün, {m.totalCommits} commit
                      </div>
                    </div>

                    {/* Polish Pillar */}
                    <div className="bg-panel p-2.5 rounded-lg border border-hairline">
                      <div className="text-[11px] font-semibold text-muted mb-1">{t("leaderboard.polish")}</div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-fg tnum">{brk.polish}</span>
                        <span className="text-[10px] text-faint">/ 25</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(brk.polish / 25) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-faint mt-1.5 truncate" title="Açıklama, yıldız ve dil zenginliği">
                        {repo.description ? "Açıklama Var ✓" : "Açıklama Yok"} {repo.stargazers_count ? `· ★${repo.stargazers_count}` : ""}
                      </div>
                    </div>

                    {/* Focus Pillar */}
                    <div className="bg-panel p-2.5 rounded-lg border border-hairline">
                      <div className="text-[11px] font-semibold text-muted mb-1">{t("leaderboard.focus")}</div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-fg tnum">{brk.focus}</span>
                        <span className="text-[10px] text-faint">/ 20</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(brk.focus / 20) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-faint mt-1.5">
                        {m.activeDays >= 15 || m.totalCommits >= 50 ? "Kanıtlanmış Odak ⭐" : `%${densityPct} Yoğunluk`}
                      </div>
                    </div>

                    {/* Recency Pillar */}
                    <div className="bg-panel p-2.5 rounded-lg border border-hairline">
                      <div className="text-[11px] font-semibold text-muted mb-1">{t("leaderboard.recency")}</div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-fg tnum">{brk.recency}</span>
                        <span className="text-[10px] text-faint">/ 10</span>
                      </div>
                      <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(brk.recency / 10) * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-faint mt-1.5 truncate">
                        {m.lastMaintenance ? formatDate(m.lastMaintenance) : "Yok"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted italic bg-panel/50 p-2.5 rounded-lg border border-hairline/60">
                    {tierConfig.summary}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
