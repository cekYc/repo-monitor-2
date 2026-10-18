"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import RepoCard from "@/components/analyze/RepoCard";
import { SectionHeader } from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";
import { getRepoActivityTimestamp } from "@/lib/repo-activity";
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
      return out.sort((a, b) =>
        direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
  }
}

/** Level 4 of the hierarchy: the repository grid.
 *
 *  The text box here filters the list that is already on screen — it is not a
 *  second search field, and it is labelled and iconed as a filter so it cannot
 *  be mistaken for one. */
export default function RepoGrid({
  repos,
  languages,
  owner,
  excluded,
  onToggleExclude,
  onClearExclusions,
  allowExport,
}: {
  repos: RepoInfo[];
  languages: { name: string; value: number }[];
  owner: string;
  excluded: Set<string>;
  onToggleExclude: (name: string) => void;
  onClearExclusions: () => void;
  allowExport: boolean;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [lang, setLang] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    let list = repos;
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
          (r.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return sortRepos(list, sort, sortDir);
  }, [repos, visibility, lang, query, sort, sortDir]);

  const filtering = Boolean(query.trim() || lang || visibility !== "all");
  const clearFilters = () => {
    setQuery("");
    setLang("");
    setVisibility("all");
  };

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
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
      link.download = `repos-${owner}-${selected.size}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // export is best-effort; the grid itself must stay usable
    } finally {
      hidden.forEach((el) => (el.style.display = ""));
      checkboxes.forEach((el) => (el.style.display = ""));
      setExporting(false);
    }
  }, [selected, owner]);

  return (
    <section className="space-y-3">
      <div className="card p-4">
        <SectionHeader
          title={t("repos.title")}
          count={visible.length === repos.length ? repos.length : `${visible.length}/${repos.length}`}
          hint={t("repos.forksExcluded")}
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
                {languages.map((l) => (
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

        {(excluded.size > 0 || allowExport) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-hairline">
            {excluded.size > 0 && (
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
                      onClick={() =>
                        setSelected(
                          selected.size === visible.length
                            ? new Set()
                            : new Set(visible.map((r) => r.name))
                        )
                      }
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

      {visible.length === 0 ? (
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
          {visible.map((repo) => (
            <div key={repo.name} data-repo-name={repo.name} className="min-w-0">
              <RepoCard
                repo={repo}
                owner={owner}
                isExcluded={excluded.has(repo.name)}
                onToggleExclude={onToggleExclude}
                selectionMode={selectionMode}
                selected={selected.has(repo.name)}
                onToggleSelect={toggleSelect}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
