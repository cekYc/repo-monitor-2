"use client";

import { useState } from "react";
import GitHubAvatar from "@/components/GitHubAvatar";
import { useLocale } from "@/components/LocaleProvider";

const TOKEN_STORAGE_KEY = "repo-monitor-gh-token";

interface RecentSearch {
  username: string;
  avatarUrl?: string;
  timestamp: number;
}

interface SearchFormProps {
  onSearch: (username: string, token: string) => void;
  loading: boolean;
  recentSearches?: RecentSearch[];
  initialUsername?: string;
}

function getSavedToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export default function SearchForm({
  onSearch,
  loading,
  recentSearches = [],
  initialUsername = "",
}: SearchFormProps) {
  const { t } = useLocale();
  const [username, setUsername] = useState(initialUsername);
  const [token, setToken] = useState(getSavedToken);
  const [showToken, setShowToken] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  });

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
    if (username.trim()) onSearch(username.trim(), token.trim());
  };

  const inputClass =
    "w-full h-11 px-3.5 rounded-xl border border-hairline bg-canvas text-fg placeholder:text-faint outline-none focus:border-accent transition-colors text-sm";

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline bg-surface p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-fg">{t("search.title")}</h2>
        <button
          type="button"
          onClick={() => setTokenOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tokenSaved ? "bg-success" : "bg-warning"}`} />
          {t("search.token.label")}
          <svg className={`w-3.5 h-3.5 transition-transform ${tokenOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {tokenOpen && (
        <div className="mb-4 p-3.5 rounded-xl bg-panel border border-hairline">
          <div className="relative">
            <input
              id="token"
              type={showToken ? "text" : "password"}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => handleTokenChange(e.target.value)}
              className={inputClass + " pr-16 font-mono"}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-faint">
              {token && (
                <button type="button" onClick={clearToken} className="hover:text-danger transition-colors text-xs" title={t("search.token.delete")}>✕</button>
              )}
              <button type="button" onClick={() => setShowToken(!showToken)} className="hover:text-fg transition-colors text-xs">
                {showToken ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <p className="text-xs mt-2">
            {tokenSaved ? (
              <span className="text-success">{t("search.token.saved")}</span>
            ) : (
              <span className="text-warning">{t("search.token.warning")}</span>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="username"
          type="text"
          placeholder={t("search.username.placeholder")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass + " flex-1"}
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="h-11 px-6 rounded-xl bg-accent text-accent-fg font-medium text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("search.loading")}
            </span>
          ) : (
            t("search.submit")
          )}
        </button>
      </div>

      {recentSearches.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-faint mb-2">{t("search.recent")}</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s.username}
                type="button"
                onClick={() => { setUsername(s.username); onSearch(s.username, token.trim()); }}
                disabled={loading}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full border border-hairline bg-surface text-sm text-muted hover:text-fg hover:border-hairline-strong transition-colors cursor-pointer disabled:opacity-50"
              >
                {s.avatarUrl && <GitHubAvatar src={s.avatarUrl} alt="" identity={s.username} width={18} height={18} className="w-[18px] h-[18px] rounded-full" />}
                <span className="font-medium">{s.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
