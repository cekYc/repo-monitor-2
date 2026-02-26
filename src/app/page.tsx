"use client";

import { useState, useCallback, useMemo } from "react";
import SearchForm from "@/components/SearchForm";
import OverallStats from "@/components/OverallStats";
import RepoCard from "@/components/RepoCard";
import ThemeToggle from "@/components/ThemeToggle";
import { UserAnalysis } from "@/lib/github";

const CACHE_PREFIX = "repo-monitor-cache-";
const CACHE_TTL = 30 * 60 * 1000; // 30 dakika

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

type SortKey = "updated" | "stars" | "size" | "languages" | "name";

export default function Home() {
  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [filterLang, setFilterLang] = useState<string>("");
  const [cacheHit, setCacheHit] = useState(false);
  const [lastUsername, setLastUsername] = useState("");
  const [lastToken, setLastToken] = useState("");
  const [excludedRepos, setExcludedRepos] = useState<Set<string>>(new Set());

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

  const handleSearch = useCallback(async (username: string, token: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setCacheHit(false);
    setLastUsername(username);
    setLastToken(token);
    setExcludedRepos(new Set());

    // Önce cache'e bak
    const cached = getCachedAnalysis(username);
    if (cached) {
      setAnalysis(cached);
      setCacheHit(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/analyze?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      // Cache'e kaydet
      setCachedAnalysis(username, data);
      setAnalysis(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleForceRefresh = useCallback(async (username: string, token: string) => {
    // Cache'i temizle ve tekrar çek
    localStorage.removeItem(CACHE_PREFIX + username.toLowerCase());
    setCacheHit(false);
    handleSearch(username, token);
  }, [handleSearch]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ThemeToggle />

      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
          Ceky's Repo Monitor
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          GitHub kullanıcılarının repolarını ve dil dağılımlarını analiz edin
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-8">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-8 py-4 shadow-lg border border-gray-200 dark:border-gray-800">
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
                Repolar analiz ediliyor, bu biraz sürebilir...
              </span>
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
                  ⚡ Cache&apos;den yüklendi (30 dk geçerli)
                </p>
                <button
                  onClick={() => handleForceRefresh(lastUsername, lastToken)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors font-medium cursor-pointer"
                >
                  🔄 Yenile
                </button>
              </div>
            )}

            <OverallStats
              analysis={analysis}
              excludedRepos={excludedRepos}
              onClearExclusions={clearExclusions}
            />

            {/* Repo List Header with Sort & Filter */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  📁 Repolar ({sortedRepos.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {/* Language Filter */}
                  <select
                    value={filterLang}
                    onChange={(e) => setFilterLang(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Tüm Diller</option>
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
                    <option value="updated">Son Güncelleme</option>
                    <option value="stars">Yıldız Sayısı</option>
                    <option value="size">Kod Boyutu</option>
                    <option value="languages">Dil Sayısı</option>
                    <option value="name">İsim (A-Z)</option>
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
                />
              ))}
            </div>

            {sortedRepos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                {filterLang
                  ? `"${filterLang}" dili kullanılan repo bulunamadı`
                  : "Repo bulunamadı"}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
        <span>Repo Monitor © 2026</span>
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
