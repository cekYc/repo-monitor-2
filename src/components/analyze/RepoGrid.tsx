"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import RepoCard from "@/components/analyze/RepoCard";
import { SectionHeader } from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";
import { getRepoActivityTimestamp } from "@/lib/repo-activity";
import { tokenHeaders } from "@/lib/token";
import { buildSampleContributedRepos } from "@/lib/sample-analysis";
import type { RepoInfo } from "@/lib/github";
import type { TranslationKey } from "@/lib/i18n";

export type SortKey =
  | "updated"
  | "commits"
  | "commitsLastMonth"
  | "score"
  | "stars"
  | "forks"
  | "size"
  | "languages"
  | "created"
  | "name";

export type SortDirection = "desc" | "asc";
export type VisibilityFilter = "all" | "public" | "private";
export type RepoTab = "owned" | "contributed";

const SORTS: { id: SortKey; labelKey: TranslationKey }[] = [
  { id: "updated", labelKey: "repos.sort.updated" },
  { id: "commits", labelKey: "repos.sort.commits" },
  { id: "commitsLastMonth", labelKey: "repos.sort.commitsLastMonth" },
  { id: "score", labelKey: "repos.sort.score" },
  { id: "stars", labelKey: "repos.sort.stars" },
  { id: "forks", labelKey: "repos.sort.forks" },
  { id: "size", labelKey: "repos.sort.size" },
  { id: "languages", labelKey: "repos.sort.languages" },
  { id: "created", labelKey: "repos.sort.created" },
  { id: "name", labelKey: "repos.sort.name" },
];

function sortRepos(repos: RepoInfo[], key: SortKey, direction: SortDirection): RepoInfo[] {
  const out = [...repos];
  const mul = direction === "desc" ? 1 : -1;

  switch (key) {
    case "updated":
      return out.sort((a, b) => mul * (getRepoActivityTimestamp(b) - getRepoActivityTimestamp(a)));
    case "commits":
      return out.sort(
        (a, b) => mul * ((b.advancedMetrics?.totalCommits ?? 0) - (a.advancedMetrics?.totalCommits ?? 0))
      );
    case "commitsLastMonth":
      return out.sort(
        (a, b) =>
          mul * ((b.advancedMetrics?.commitsLastMonth ?? 0) - (a.advancedMetrics?.commitsLastMonth ?? 0))
      );
    case "score":
      return out.sort(
        (a, b) => mul * ((b.advancedMetrics?.projectScore ?? 0) - (a.advancedMetrics?.projectScore ?? 0))
      );
    case "stars":
      return out.sort((a, b) => mul * (b.stargazers_count - a.stargazers_count));
    case "forks":
      return out.sort((a, b) => mul * (b.forks_count - a.forks_count));
    case "size":
      return out.sort((a, b) => mul * (b.totalBytes - a.totalBytes));
    case "languages":
      return out.sort((a, b) => mul * (b.languagePercentages.length - a.languagePercentages.length));
    case "created":
      return out.sort(
        (a, b) => mul * (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
    case "name":
      return out.sort((a, b) => {
        const nameA = a.fullName || a.name;
        const nameB = b.fullName || b.name;
        return direction === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
  }
}

/** Level 4 of the hierarchy: the repository grid with Owned and Contributed tabs. */
export default function RepoGrid({
  repos,
  languages,
  owner,
  excluded,
  onToggleExclude,
  onClearExclusions,
  allowExport,
  isSample = false,
}: {
  repos: RepoInfo[];
  languages: { name: string; value: number }[];
  owner: string;
  excluded: Set<string>;
  onToggleExclude: (name: string) => void;
  onClearExclusions: () => void;
  allowExport: boolean;
  isSample?: boolean;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<RepoTab>("owned");
  const [contributedRepos, setContributedRepos] = useState<RepoInfo[] | null>(null);
  const [contributedLoading, setContributedLoading] = useState(false);
  const fetchedOwner = useRef<string | null>(null);

  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [lang, setLang] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchContributed = useCallback(
    async (targetOwner: string) => {
      if (!targetOwner) return;
      if (isSample || targetOwner.toLowerCase().startsWith("octo-sample")) {
        setContributedRepos(buildSampleContributedRepos());
        fetchedOwner.current = targetOwner.toLowerCase();
        return;
      }
      setContributedLoading(true);
      try {
        const res = await fetch(
          `/api/contributed-repos?username=${encodeURIComponent(targetOwner)}`,
          { headers: tokenHeaders() }
        );
        if (!res.ok) throw new Error("Failed to fetch contributed repositories");
        const data = await res.json();
        setContributedRepos(data.repos ?? []);
        fetchedOwner.current = targetOwner.toLowerCase();
      } catch {
        setContributedRepos([]);
      } finally {
        setContributedLoading(false);
      }
    },
    [isSample]
  );

  // Reset when analyzed owner changes
  useEffect(() => {
    setContributedRepos(null);
    fetchedOwner.current = null;
    setTab("owned");
    setQuery("");
    setLang("");
    setVisibility("all");
    setSelected(new Set());
    setSelectionMode(false);
  }, [owner]);

  const switchTab = (nextTab: RepoTab) => {
    setTab(nextTab);
    setQuery("");
    setLang("");
    setVisibility("all");
    setSelectionMode(false);
    setSelected(new Set());
    if (nextTab === "contributed" && fetchedOwner.current !== owner.toLowerCase()) {
      fetchContributed(owner);
    }
  };

  const activeRepos = useMemo(() => {
    return tab === "owned" ? repos : (contributedRepos ?? []);
  }, [tab, repos, contributedRepos]);

  // Compute language options for contributed repos dynamically
  const contributedLanguages = useMemo(() => {
    if (!contributedRepos) return [];
    const map: Record<string, number> = {};
    let total = 0;
    for (const r of contributedRepos) {
      for (const [langName, bytes] of Object.entries(r.languages)) {
        map[langName] = (map[langName] ?? 0) + bytes;
        total += bytes;
      }
    }
    return Object.entries(map)
      .map(([name, bytes]) => ({
        name,
        value: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [contributedRepos]);

  const currentLanguages = tab === "owned" ? languages : contributedLanguages;

  const visible = useMemo(() => {
    let list = activeRepos;
    if (visibility === "public") {
      list = list.filter((r) => !r.private);
    } else if (visibility === "private") {
      list = list.filter((r) => r.private);
    }
    if (lang) list = list.filter((r) => r.languagePercentages.some((l) => l.name === lang));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.fullName?.toLowerCase().includes(q) ?? false) ||
          (r.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return sortRepos(list, sort, sortDir);
  }, [activeRepos, visibility, lang, query, sort, sortDir]);

  const filtering = Boolean(query.trim() || lang || visibility !== "all");
  const clearFilters = () => {
    setQuery("");
    setLang("");
    setVisibility("all");
  };

  const toggleSelect = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const exportSelected = useCallback(async () => {
    const container = gridRef.current;
    if (!container || selected.size === 0) return;
    setExporting(true);
    const hidden: HTMLElement[] = [];
    const checkboxes = container.querySelectorAll<HTMLElement>("[data-repo-checkbox]");
    try {
      container.querySelectorAll<HTMLElement>("[data-repo-name]").forEach((el) => {
        const name = el.getAttribute("data-repo-name");
        if (name && !selected.has(name)) {
          el.style.display = "none";
          hidden.push(el);
        }
      });
      checkboxes.forEach((el) => (el.style.display = "none"));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(container, {
        backgroundColor: document.documentElement.classList.contains("dark")
          ? "#09090b"
          : "#fafafa",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `repos-${owner}-${tab}-${selected.size}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // export is best-effort
    } finally {
      hidden.forEach((el) => (el.style.display = ""));
      checkboxes.forEach((el) => (el.style.display = ""));
      setExporting(false);
    }
  }, [selected, owner, tab]);

  return (
    <section className="space-y-3">
      <div className="card p-4 space-y-4">
        {/* Top bar: Tab Switcher & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
          <div
            role="tablist"
            aria-label={t("repos.title")}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-panel border border-hairline"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "owned"}
              onClick={() => switchTab("owned")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === "owned"
                  ? "bg-surface text-fg shadow-sm border border-hairline"
                  : "text-muted hover:text-fg hover:bg-surface/50"
              }`}
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
              <span>{t("repos.tab.owned")}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                  tab === "owned" ? "bg-accent/15 text-accent-text" : "bg-surface text-faint"
                }`}
              >
                {repos.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === "contributed"}
              onClick={() => switchTab("contributed")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                tab === "contributed"
                  ? "bg-surface text-fg shadow-sm border border-hairline"
                  : "text-muted hover:text-fg hover:bg-surface/50"
              }`}
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>{t("repos.tab.contributed")}</span>
              {contributedLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block ml-0.5" />
              ) : contributedRepos !== null ? (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                    tab === "contributed"
                      ? "bg-accent/15 text-accent-text"
                      : "bg-surface text-faint"
                  }`}
                >
                  {contributedRepos.length}
                </span>
              ) : null}
            </button>
          </div>

          <p className="t-caption text-faint">
            {tab === "owned" ? t("repos.forksExcluded") : t("repos.contributedHint")}
          </p>
        </div>

        {/* Header & Filter Controls Row */}
        <SectionHeader
          title={tab === "owned" ? t("repos.title") : t("repos.contributedTitle")}
          count={
            tab === "contributed" && contributedLoading
              ? undefined
              : visible.length === activeRepos.length
                ? activeRepos.length
                : `${visible.length}/${activeRepos.length}`
          }
          right={
            <>
              <label className="relative">
                <span className="sr-only">{t("repos.filter.label")}</span>
                <svg
                  className="w-3.5 h-3.5 text-faint absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("repos.filter.placeholder")}
                  className="field w-full sm:w-52 pl-8"
                />
              </label>

              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
                aria-label={t("repos.visibility.label")}
                className="field w-auto cursor-pointer"
              >
                <option value="all">{t("repos.visibility.all")}</option>
                <option value="public">{t("repos.visibility.public")}</option>
                <option value="private">{t("repos.visibility.private")}</option>
              </select>

              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                aria-label={t("repos.allLangs")}
                className="field w-auto cursor-pointer"
              >
                <option value="">{t("repos.allLangs")}</option>
                {currentLanguages.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name} · {l.value}%
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label={t("repos.sortLabel")}
                className="field w-auto cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.labelKey)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
                aria-label={sortDir === "desc" ? t("repos.sort.desc") : t("repos.sort.asc")}
                title={sortDir === "desc" ? t("repos.sort.desc") : t("repos.sort.asc")}
                className="field w-auto cursor-pointer inline-flex items-center gap-1.5 select-none hover:border-hairline-strong transition-colors"
              >
                {sortDir === "desc" ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-faint shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>{t("repos.sort.desc")}</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5 text-faint shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>{t("repos.sort.asc")}</span>
                  </>
                )}
              </button>
            </>
          }
        />

        {/* Exclusion or Export actions bar */}
        {((tab === "owned" && excluded.size > 0) || allowExport) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-hairline">
            {tab === "owned" && excluded.size > 0 && (
              <>
                <span className="t-caption text-warning">
                  {excluded.size} {t("exclusion.banner")}
                </span>
                <button type="button" onClick={onClearExclusions} className="btn btn-ghost btn-sm">
                  {t("exclusion.includeAll")}
                </button>
              </>
            )}

            {allowExport && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {selectionMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const allKeys = visible.map((r) => r.fullName || r.name);
                        setSelected(
                          selected.size === visible.length ? new Set() : new Set(allKeys)
                        );
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      {selected.size === visible.length && visible.length > 0
                        ? t("repos.export.deselectAll")
                        : t("repos.export.selectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={exportSelected}
                      disabled={exporting || selected.size === 0}
                      className="btn btn-primary btn-sm"
                    >
                      {exporting
                        ? t("repos.export.exporting")
                        : `${t("repos.export.button")} (${selected.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelected(new Set());
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      {t("action.cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectionMode(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    {t("repos.export.start")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Content / Loading / Empty States */}
      {tab === "contributed" && contributedLoading ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-hairline bg-panel px-3 py-2 text-center">
            <p className="t-caption text-muted flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
              {t("repos.contributedLoading")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 h-48 animate-pulse flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-surface-hover shrink-0" />
                    <div className="h-4 bg-surface-hover rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-surface-hover rounded w-3/4" />
                  <div className="h-3 bg-surface-hover rounded w-1/2" />
                </div>
                <div className="space-y-2 pt-3 border-t border-hairline">
                  <div className="h-2 bg-surface-hover rounded-full w-full" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-surface-hover rounded w-20" />
                    <div className="h-3 bg-surface-hover rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeRepos.length === 0 ? (
        <EmptyState
          title={tab === "contributed" ? t("repos.contributedEmpty") : t("repos.notFound")}
          body={tab === "contributed" ? t("repos.contributedEmptyBody") : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filtering ? t("repos.noMatch") : t("repos.notFound")}
          body={filtering ? t("repos.noMatchBody") : undefined}
          action={
            filtering ? (
              <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">
                {t("action.clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div ref={gridRef} className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((repo) => {
            const key = repo.fullName || repo.name;
            return (
              <div key={key} data-repo-name={key} className="min-w-0">
                <RepoCard
                  repo={repo}
                  owner={owner}
                  isExcluded={tab === "owned" ? excluded.has(repo.name) : false}
                  onToggleExclude={onToggleExclude}
                  selectionMode={selectionMode}
                  selected={selected.has(key)}
                  onToggleSelect={toggleSelect}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
