"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import OverallStats from "@/components/OverallStats";
import RepoCard from "@/components/RepoCard";
import OrgAnalyzer from "@/components/OrgAnalyzer";
import BadgeGenerator from "@/components/BadgeGenerator";
import RepoSuggestions from "@/components/RepoSuggestions";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import PwaInstallButton from "@/components/PwaInstallButton";
import RateLimitBadge from "@/components/RateLimitBadge";
import HealthScore from "@/components/HealthScore";
import DeveloperPersona from "@/components/DeveloperPersona";
import CustomExtensionScanner from "@/components/CustomExtensionScanner";
import Dashboard from "@/components/Dashboard";
import Overview from "@/components/Overview";
import CompareView from "@/components/CompareView";
import WatchButton from "@/components/WatchButton";
import RepoTimeline from "@/components/RepoTimeline";
import AppShell, { type ViewId } from "@/components/AppShell";
import { useLocale } from "@/components/LocaleProvider";
import { listWatches } from "@/lib/watchlist";
import { UserAnalysis } from "@/lib/github";

const CACHE_PREFIX = "repo-monitor-cache-";
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika
const RECENT_SEARCHES_KEY = "repo-monitor-recent-searches";
const MAX_RECENT = 8;

interface CachedData {
  timestamp: number;
  data: UserAnalysis;
}

function getCachedAnalysis(username: string): UserAnalysis | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + username.toLowerCase());
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + username.toLowerCase());
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedAnalysis(username: string, data: UserAnalysis) {
  try {
    const entry: CachedData = { timestamp: Date.now(), data };
    localStorage.setItem(CACHE_PREFIX + username.toLowerCase(), JSON.stringify(entry));
  } catch {
    // localStorage dolu olabilir, sessizce geç
  }
}

interface RecentSearch {
  username: string;
  avatarUrl?: string;
  timestamp: number;
}

function getRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(username: string, avatarUrl?: string) {
  try {
    let searches = getRecentSearches();
    searches = searches.filter((s) => s.username.toLowerCase() !== username.toLowerCase());
    searches.unshift({ username, avatarUrl, timestamp: Date.now() });
    searches = searches.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

type SortKey = "updated" | "stars" | "size" | "languages" | "name" | "nameDesc" | "created" | "forks";

interface ProgressInfo {
  current: number;
  total: number;
  repoName: string;
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();

  const [view, setView] = useState<ViewId>("overview");
  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [filterLang, setFilterLang] = useState<string>("");
  const [cacheHit, setCacheHit] = useState(false);
  const [lastUsername, setLastUsername] = useState("");
  const [lastToken, setLastToken] = useState("");
  const [excludedRepos, setExcludedRepos] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [watchCount, setWatchCount] = useState(0);
  const autoSearchDone = useRef(false);

  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [repoExporting, setRepoExporting] = useState(false);
  const repoExportRef = useRef<HTMLDivElement>(null);

  const refreshWatchCount = useCallback(() => {
    listWatches().then((w) => setWatchCount(w.length));
  }, []);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    refreshWatchCount();
  }, [refreshWatchCount]);

  const toggleExcludeRepo = useCallback((repoName: string) => {
    setExcludedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoName)) next.delete(repoName);
      else next.add(repoName);
      return next;
    });
  }, []);

  const clearExclusions = useCallback(() => setExcludedRepos(new Set()), []);

  const toggleSelectRepo = useCallback((repoName: string) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoName)) next.delete(repoName);
      else next.add(repoName);
      return next;
    });
  }, []);

  const handleExportSelectedRepos = useCallback(async () => {
    if (!repoExportRef.current || selectedRepos.size === 0) return;
    setRepoExporting(true);
    try {
      const container = repoExportRef.current;
      const wrappers = container.querySelectorAll<HTMLElement>("[data-repo-name]");
      const hidden: HTMLElement[] = [];
      wrappers.forEach((el) => {
        const name = el.getAttribute("data-repo-name");
        if (name && !selectedRepos.has(name)) {
          el.style.display = "none";
          hidden.push(el);
        }
      });
      const checkboxes = container.querySelectorAll<HTMLElement>("[data-repo-checkbox]");
      checkboxes.forEach((el) => (el.style.display = "none"));

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(container, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff",
        pixelRatio: 2,
      });

      hidden.forEach((el) => (el.style.display = ""));
      checkboxes.forEach((el) => (el.style.display = ""));

      const link = document.createElement("a");
      link.download = `repos-${lastUsername}-${selectedRepos.size}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Repo PNG export failed:", err);
    } finally {
      setRepoExporting(false);
    }
  }, [selectedRepos, lastUsername]);

  const handleSearch = useCallback(async (username: string, token: string) => {
    setView("analyze");
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCacheHit(false);
    setLastUsername(username);
    setLastToken(token);
    setExcludedRepos(new Set());
    setSelectedRepos(new Set());
    setProgress(null);

    const url = new URL(window.location.href);
    url.searchParams.set("user", username);
    router.replace(url.pathname + url.search, { scroll: false });

    const cached = getCachedAnalysis(username);
    if (cached) {
      setAnalysis(cached);
      setCacheHit(true);
      setLoading(false);
      addRecentSearch(username, cached.user.avatar_url);
      setRecentSearches(getRecentSearches());
      return;
    }

    try {
      const params = new URLSearchParams({ username });
      if (token) params.set("token", token);
      const response = await fetch(`/api/analyze-stream?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Bir hata oluştu");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming desteklenmiyor");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          let eventType = "";
          let dataStr = "";
          for (const line of trimmed.split("\n")) {
            if (line.startsWith("event: ")) eventType = line.substring(7).trim();
            else if (line.startsWith("data: ")) dataStr += line.substring(6);
          }
          if (!dataStr) continue;
          let data;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }
          if (eventType === "progress") setProgress(data);
          else if (eventType === "complete") {
            setCachedAnalysis(username, data);
            setAnalysis(data);
            addRecentSearch(username, data.user?.avatar_url);
            setRecentSearches(getRecentSearches());
          } else if (eventType === "error") throw new Error(data.error);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [router]);

  useEffect(() => {
    if (autoSearchDone.current) return;
    const userParam = searchParams.get("user");
    if (userParam) {
      autoSearchDone.current = true;
      const savedToken = localStorage.getItem("repo-monitor-gh-token") || "";
      handleSearch(userParam, savedToken);
    }
  }, [searchParams, handleSearch]);

  const handleForceRefresh = useCallback(async (username: string, token: string) => {
    localStorage.removeItem(CACHE_PREFIX + username.toLowerCase());
    setCacheHit(false);
    handleSearch(username, token);
  }, [handleSearch]);

  const handleAnalyzeUser = useCallback((login: string) => {
    const savedToken = localStorage.getItem("repo-monitor-gh-token") || "";
    handleSearch(login, savedToken);
  }, [handleSearch]);

  const navigate = useCallback((id: ViewId) => {
    setView(id);
    if (id === "watchlist" || id === "overview") refreshWatchCount();
  }, [refreshWatchCount]);

  const getSortedRepos = () => {
    if (!analysis) return [];
    let repos = [...analysis.repos];
    if (filterLang) repos = repos.filter((r) => r.languagePercentages.some((l) => l.name === filterLang));
    switch (sortBy) {
      case "updated": repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); break;
      case "stars": repos.sort((a, b) => b.stargazers_count - a.stargazers_count); break;
      case "size": repos.sort((a, b) => b.totalBytes - a.totalBytes); break;
      case "languages": repos.sort((a, b) => b.languagePercentages.length - a.languagePercentages.length); break;
      case "name": repos.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "nameDesc": repos.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "created": repos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "forks": repos.sort((a, b) => b.forks_count - a.forks_count); break;
    }
    return repos;
  };

  const sortedRepos = getSortedRepos();
  const selectClass =
    "h-9 px-3 rounded-lg border border-hairline bg-canvas text-sm text-muted focus:border-accent outline-none cursor-pointer";

  return (
    <AppShell active={view} onNavigate={navigate} onAnalyzeUser={handleAnalyzeUser} watchCount={watchCount}>
      {view === "overview" && (
        <Overview
          recentSearches={recentSearches}
          onAnalyzeUser={handleAnalyzeUser}
          onGoWatchlist={() => navigate("watchlist")}
        />
      )}

      {view === "watchlist" && <Dashboard onAnalyzeUser={handleAnalyzeUser} />}

      {view === "compare" && <CompareView initialA={lastUsername} />}

      {view === "analyze" && (
        <div className="space-y-6">
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            recentSearches={recentSearches}
            initialUsername={searchParams.get("user") || ""}
          />

          <OrgAnalyzer token={lastToken} />

          {loading && (
            <div className="flex justify-center py-12">
              <div className="inline-flex flex-col items-center gap-4 bg-surface rounded-2xl px-8 py-6 border border-hairline min-w-[320px]">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-fg font-medium text-sm">
                    {progress ? `${t("progress.analyzing")} (${progress.current}/${progress.total})` : t("progress.loading")}
                  </span>
                </div>
                {progress && (
                  <>
                    <div className="w-full bg-panel rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-faint font-mono truncate max-w-70">{progress.repoName}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-hairline bg-danger-soft p-4 text-center">
              <p className="text-danger font-medium text-sm">{error}</p>
            </div>
          )}

          {analysis && (
            <>
              {cacheHit && (
                <div className="rounded-xl border border-hairline bg-warning-soft p-3 flex items-center justify-between">
                  <p className="text-warning text-sm font-medium">{t("cache.loaded")}</p>
                  <button
                    onClick={() => handleForceRefresh(lastUsername, lastToken)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-hairline text-muted hover:text-fg hover:bg-surface transition-colors cursor-pointer"
                  >
                    {t("cache.refresh")}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <WatchButton type="user" label={analysis.user.login} avatarUrl={analysis.user.avatar_url} onChange={refreshWatchCount} />
              </div>

              <OverallStats analysis={analysis} excludedRepos={excludedRepos} onClearExclusions={clearExclusions} />

              {/* Repo list */}
              <div className="rounded-2xl border border-hairline bg-surface p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-fg">
                    {t("repos.title")} <span className="text-faint font-normal tnum">{sortedRepos.length}</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)} className={selectClass}>
                      <option value="">{t("repos.allLangs")}</option>
                      {analysis.overallLanguages.map((l) => (
                        <option key={l.name} value={l.name}>{l.name} (%{l.value})</option>
                      ))}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className={selectClass}>
                      <option value="updated">{t("repos.sort.updated")}</option>
                      <option value="created">{t("repos.sort.created")}</option>
                      <option value="stars">{t("repos.sort.stars")}</option>
                      <option value="forks">{t("repos.sort.forks")}</option>
                      <option value="size">{t("repos.sort.size")}</option>
                      <option value="languages">{t("repos.sort.languages")}</option>
                      <option value="name">{t("repos.sort.name")}</option>
                      <option value="nameDesc">{t("repos.sort.nameDesc")}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-hairline">
                  <button
                    onClick={() => {
                      if (selectedRepos.size === sortedRepos.length) setSelectedRepos(new Set());
                      else setSelectedRepos(new Set(sortedRepos.map((r) => r.name)));
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-hairline text-muted hover:text-fg hover:bg-panel transition-colors cursor-pointer"
                  >
                    {selectedRepos.size === sortedRepos.length && sortedRepos.length > 0 ? t("repos.export.deselectAll") : t("repos.export.selectAll")}
                  </button>
                  {selectedRepos.size > 0 && (
                    <>
                      <span className="text-xs text-faint">{selectedRepos.size} {t("repos.export.selected")}</span>
                      <button
                        onClick={handleExportSelectedRepos}
                        disabled={repoExporting}
                        className="text-xs px-3 py-1.5 rounded-lg bg-accent-soft text-accent-text hover:bg-accent-soft/70 transition-colors cursor-pointer disabled:opacity-50 font-medium"
                      >
                        {repoExporting ? t("repos.export.exporting") : t("repos.export.button")}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3" ref={repoExportRef}>
                {sortedRepos.map((repo, i) => (
                  <div key={repo.name} data-repo-name={repo.name}>
                    <div className="flex gap-2.5 items-start">
                      <button
                        type="button"
                        data-repo-checkbox
                        onClick={() => toggleSelectRepo(repo.name)}
                        className={`mt-4 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                          selectedRepos.has(repo.name) ? "bg-accent border-accent text-accent-fg" : "border-hairline-strong hover:border-accent"
                        }`}
                      >
                        {selectedRepos.has(repo.name) && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <RepoCard repo={repo} index={i} isExcluded={excludedRepos.has(repo.name)} onToggleExclude={toggleExcludeRepo} owner={analysis.user.login} token={lastToken} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sortedRepos.length === 0 && (
                <div className="text-center py-12 text-faint">
                  {filterLang ? `"${filterLang}" ${t("repos.langNotFound")}` : t("repos.notFound")}
                </div>
              )}

              {/* Advanced modules */}
              <div className="pt-2">
                <h2 className="text-sm font-semibold text-fg mb-3">{t("analyze.modules")}</h2>
                <div className="space-y-4">
                  <RepoTimeline repos={analysis.repos} />
                  <BadgeGenerator username={analysis.user.login} token={lastToken} />
                  <HealthScore username={analysis.user.login} token={lastToken} />
                  <ContributionHeatmap username={analysis.user.login} token={lastToken} />
                  <DeveloperPersona username={analysis.user.login} token={lastToken} />
                  <CustomExtensionScanner username={analysis.user.login} token={lastToken} />
                  <RepoSuggestions topLanguages={analysis.overallLanguages.slice(0, 3).map((l) => l.name)} token={lastToken} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <RateLimitBadge token={lastToken} />
      <PwaInstallButton />
    </AppShell>
  );
}
