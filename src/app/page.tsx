"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import OverallStats from "@/components/OverallStats";
import RepoCard from "@/components/RepoCard";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleToggle from "@/components/LocaleToggle";
import RateLimitBadge from "@/components/RateLimitBadge";
import UserCompare from "@/components/UserCompare";
import { useLocale } from "@/components/LocaleProvider";
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
    localStorage.setItem(
      CACHE_PREFIX + username.toLowerCase(),
      JSON.stringify(entry)
    );
  } catch {
    // localStorage dolu olabilir, sessizce geç
  }
}

// --- Recent Searches ---
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
    // Remove existing entry for this user
    searches = searches.filter(
      (s) => s.username.toLowerCase() !== username.toLowerCase()
    );
    // Add to front
    searches.unshift({ username, avatarUrl, timestamp: Date.now() });
    // Keep max
    searches = searches.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

type SortKey = "updated" | "stars" | "size" | "languages" | "name";

// --- Progress State ---
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
  const { t, locale } = useLocale();

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
  const autoSearchDone = useRef(false);

  // Compare state
  const [compareAnalysis, setCompareAnalysis] = useState<UserAnalysis | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  const toggleExcludeRepo = useCallback((repoName: string) => {
    setExcludedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoName)) {
        next.delete(repoName);
      } else {
        next.add(repoName);
      }
      return next;
    });
  }, []);

  const clearExclusions = useCallback(() => {
    setExcludedRepos(new Set());
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const handleSearch = useCallback(async (username: string, token: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCacheHit(false);
    setLastUsername(username);
    setLastToken(token);
    setExcludedRepos(new Set());
    setProgress(null);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("user", username);
    router.replace(url.pathname + url.search, { scroll: false });

    // Check cache first
    const cached = getCachedAnalysis(username);
    if (cached) {
      setAnalysis(cached);
      setCacheHit(true);
      setLoading(false);
      addRecentSearch(username, cached.user.avatar_url);
      setRecentSearches(getRecentSearches());
      return;
    }

    // Use SSE streaming endpoint
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

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.substring(6));

            if (eventType === "progress") {
              setProgress(data);
            } else if (eventType === "complete") {
              setCachedAnalysis(username, data);
              setAnalysis(data);
              addRecentSearch(username, data.user?.avatar_url);
              setRecentSearches(getRecentSearches());
            } else if (eventType === "error") {
              throw new Error(data.error);
            }
          } else if (line.trim() === "") {
            // Event boundary, reset
            eventType = "";
          } else {
            // Incomplete line, keep in buffer
            buffer = line;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [router]);

  // Auto-search from URL query param
  useEffect(() => {
    if (autoSearchDone.current) return;
    const userParam = searchParams.get("user");
    if (userParam) {
      autoSearchDone.current = true;
      // Get token from localStorage
      const savedToken = localStorage.getItem("repo-monitor-gh-token") || "";
      handleSearch(userParam, savedToken);
    }
  }, [searchParams, handleSearch]);

  const handleForceRefresh = useCallback(async (username: string, token: string) => {
    // Cache'i temizle ve tekrar çek
    localStorage.removeItem(CACHE_PREFIX + username.toLowerCase());
    setCacheHit(false);
    handleSearch(username, token);
  }, [handleSearch]);

  // Compare handler
  const handleCompare = useCallback(async (username: string, token: string) => {
    setCompareLoading(true);
    setCompareError(null);
    setCompareAnalysis(null);
    setShowCompare(true);

    try {
      const params = new URLSearchParams({ username });
      if (token) params.set("token", token);

      const response = await fetch(`/api/analyze?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("error.generic"));
      setCompareAnalysis(data);
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setCompareLoading(false);
    }
  }, [t]);

  const getSortedRepos = () => {
    if (!analysis) return [];

    let repos = [...analysis.repos];

    // Filter by language
    if (filterLang) {
      repos = repos.filter((r) =>
        r.languagePercentages.some((l) => l.name === filterLang)
      );
    }

    // Sort
    switch (sortBy) {
      case "updated":
        repos.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        );
        break;
      case "stars":
        repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
        break;
      case "size":
        repos.sort((a, b) => b.totalBytes - a.totalBytes);
        break;
      case "languages":
        repos.sort(
          (a, b) => b.languagePercentages.length - a.languagePercentages.length
        );
        break;
      case "name":
        repos.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return repos;
  };

  const sortedRepos = getSortedRepos();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ThemeToggle />
      <LocaleToggle />

      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-extrabold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
          Ceky&apos;s Repo Monitor
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t("header.subtitle")}
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        <SearchForm
          onSearch={handleSearch}
          onCompare={handleCompare}
          loading={loading}
          recentSearches={recentSearches}
          initialUsername={searchParams.get("user") || ""}
          showCompareMode={!!analysis}
          compareLoading={compareLoading}
        />

        {/* Loading State with Progress */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl px-8 py-6 shadow-lg border border-gray-200 dark:border-gray-800 min-w-[320px]">
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {progress
                    ? `${t("progress.analyzing")} (${progress.current}/${progress.total})`
                    : t("progress.loading")}
                </span>
              </div>
              {progress && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-linear-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((progress.current / progress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-70">
                    {progress.repoName}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <>
            {/* Cache Status Indicator */}
            {cacheHit && (
              <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 flex items-center justify-between">
                <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                  {t("cache.loaded")}
                </p>
                <button
                  onClick={() => handleForceRefresh(lastUsername, lastToken)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors font-medium cursor-pointer"
                >
                  {t("cache.refresh")}
                </button>
              </div>
            )}

            <OverallStats
              analysis={analysis}
              excludedRepos={excludedRepos}
              onClearExclusions={clearExclusions}
            />

            {/* Compare Section */}
            {showCompare && (
              <div className="space-y-4">
                {compareLoading && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-800">
                      <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{t("progress.analyzing")}</span>
                    </div>
                  </div>
                )}
                {compareError && (
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                    <p className="text-red-600 dark:text-red-400 font-medium text-sm">❌ {compareError}</p>
                  </div>
                )}
                {compareAnalysis && analysis && (
                  <>
                    <UserCompare userA={analysis} userB={compareAnalysis} />
                    <div className="text-center">
                      <button
                        onClick={() => { setShowCompare(false); setCompareAnalysis(null); }}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        {t("search.compare.cancel")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Repo List Header with Sort & Filter */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {t("repos.title")} ({sortedRepos.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {/* Language Filter */}
                  <select
                    value={filterLang}
                    onChange={(e) => setFilterLang(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">{t("repos.allLangs")}</option>
                    {analysis.overallLanguages.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name} (%{l.value})
                      </option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="updated">{t("repos.sort.updated")}</option>
                    <option value="stars">{t("repos.sort.stars")}</option>
                    <option value="size">{t("repos.sort.size")}</option>
                    <option value="languages">{t("repos.sort.languages")}</option>
                    <option value="name">{t("repos.sort.name")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Repo Cards */}
            <div className="grid gap-4">
              {sortedRepos.map((repo, i) => (
                <RepoCard
                  key={repo.name}
                  repo={repo}
                  index={i}
                  isExcluded={excludedRepos.has(repo.name)}
                  onToggleExclude={toggleExcludeRepo}
                  owner={analysis.user.login}
                  token={lastToken}
                />
              ))}
            </div>

            {sortedRepos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {filterLang
                  ? `"${filterLang}" ${t("repos.langNotFound")}`
                  : t("repos.notFound")}
              </div>
            )}
          </>
        )}
      </main>

      {/* Rate Limit Badge */}
      <RateLimitBadge token={lastToken} />

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
        <span>{t("footer.copyright")}</span>
        <span className="mx-1.5">·</span>
        <a
          href="https://github.com/cekYc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          cekYc
        </a>
      </footer>
    </div>
  );
}