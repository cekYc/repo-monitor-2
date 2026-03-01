"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface Suggestion {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  forks_count: number;
}

interface RepoSuggestionsProps {
  topLanguages: string[];
  token: string;
}

export default function RepoSuggestions({ topLanguages, token }: RepoSuggestionsProps) {
  const { t } = useLocale();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (topLanguages.length === 0) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        languages: topLanguages.slice(0, 3).join(","),
      });
      if (token) params.set("token", token);
      const res = await fetch(`/api/suggestions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [topLanguages, token]);

  useEffect(() => {
    if (!loaded && topLanguages.length > 0) {
      const timeout = setTimeout(fetchSuggestions, 0);
      return () => clearTimeout(timeout);
    }
  }, [fetchSuggestions, loaded, topLanguages.length]);

  if (!loaded && !loading) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        {t("suggestions.title")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {t("suggestions.description")}
      </p>

      {loading && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t("suggestions.loading")}
          </div>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">{t("suggestions.empty")}</p>
      )}

      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((repo) => (
            <a
              key={repo.name}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline truncate">
                  {repo.name}
                </h3>
                {repo.language && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
                    {repo.language}
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>⭐ {repo.stargazers_count.toLocaleString()} {t("suggestions.star")}</span>
                <span>🍴 {repo.forks_count.toLocaleString()}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
