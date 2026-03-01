"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";

const TOKEN_STORAGE_KEY = "repo-monitor-gh-token";

interface RecentSearch {
  username: string;
  avatarUrl?: string;
  timestamp: number;
}

interface SearchFormProps {
  onSearch: (username: string, token: string) => void;
  onCompare?: (username: string, token: string) => void;
  loading: boolean;
  recentSearches?: RecentSearch[];
  initialUsername?: string;
  showCompareMode?: boolean;
  compareLoading?: boolean;
}

function getSavedToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export default function SearchForm({
  onSearch,
  onCompare,
  loading,
  recentSearches = [],
  initialUsername = "",
  showCompareMode = false,
  compareLoading = false,
}: SearchFormProps) {
  const { t } = useLocale();
  const [username, setUsername] = useState(initialUsername);
  const [token, setToken] = useState(getSavedToken);
  const [showToken, setShowToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [compareUsername, setCompareUsername] = useState("");
  const [showCompareInput, setShowCompareInput] = useState(false);

  const handleTokenChange = (value: string) => {
    setToken(value);
    if (value.trim()) {
      localStorage.setItem(TOKEN_STORAGE_KEY, value.trim());
      setTokenSaved(true);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setTokenSaved(false);
    }
  };

  const clearToken = () => {
    setToken("");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setTokenSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim(), token.trim());
    }
  };

  const handleCompareSubmit = () => {
    if (compareUsername.trim() && onCompare) {
      onCompare(compareUsername.trim(), token.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          {t("search.title")}
        </h2>

        <div className="space-y-4">
          {/* Token Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="token"
                className="block text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                {t("search.token.label")}
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t("search.token.optional")}
              </span>
            </div>
            <div className="relative">
              <input
                id="token"
                type={showToken ? "text" : "password"}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {token && (
                  <button
                    type="button"
                    onClick={clearToken}
                    className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                    title={t("search.token.delete")}
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showToken ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <p className="text-xs mt-1">
              {tokenSaved ? (
                <span className="text-green-500">{t("search.token.saved")}</span>
              ) : (
                <span className="text-amber-500 dark:text-amber-400">{t("search.token.warning")}</span>
              )}
            </p>
          </div>

          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              {t("search.username.label")}
            </label>
            <input
              id="username"
              type="text"
              placeholder={t("search.username.placeholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 px-6 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("search.loading")}
              </span>
            ) : (
              t("search.submit")
            )}
          </button>

          {/* Compare Toggle & Input */}
          {showCompareMode && onCompare && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {!showCompareInput ? (
                <button
                  type="button"
                  onClick={() => setShowCompareInput(true)}
                  className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium cursor-pointer transition-colors"
                >
                  {t("search.compare.toggle")}
                </button>
              ) : (
                <div className="space-y-3">
                  <label htmlFor="compare-username" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("search.compare.label")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="compare-username"
                      type="text"
                      placeholder={t("search.compare.placeholder")}
                      value={compareUsername}
                      onChange={(e) => setCompareUsername(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm"
                    />
                    <button
                      type="button"
                      disabled={!compareUsername.trim() || compareLoading}
                      onClick={handleCompareSubmit}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {compareLoading ? "..." : t("search.compare.button")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCompareInput(false); setCompareUsername(""); }}
                      className="px-3 py-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">
                {t("search.recent")}
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s.username}
                    type="button"
                    onClick={() => {
                      setUsername(s.username);
                      onSearch(s.username, token.trim());
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                  >
                    {s.avatarUrl && (
                      <Image src={s.avatarUrl} alt="" width={16} height={16} className="w-4 h-4 rounded-full" />
                    )}
                    <span className="font-medium">{s.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
