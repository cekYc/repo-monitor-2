"use client";

import { getLanguageColor, formatBytes, formatDate } from "@/lib/utils";
import { RepoInfo, RepoCommitHistory } from "@/lib/github";
import { useState } from "react";
import Link from "next/link";
import CommitHistory from "./CommitHistory";
import SegmentBar from "@/components/SegmentBar";
import { useLocale } from "@/components/LocaleProvider";

interface RepoCardProps {
  repo: RepoInfo;
  index: number;
  isExcluded: boolean;
  onToggleExclude: (repoName: string) => void;
  owner: string;
  token: string;
}

export default function RepoCard({ repo, index, isExcluded, onToggleExclude, owner, token }: RepoCardProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [commitHistory, setCommitHistory] = useState<RepoCommitHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadCommitHistory = async () => {
    if (commitHistory) {
      setShowHistory(!showHistory);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    setShowHistory(true);
    try {
      const params = new URLSearchParams({ owner, repo: repo.name });
      if (token) params.set("token", token);
      const res = await fetch(`/api/commit-history?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error.generic"));
      setCommitHistory(data);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const hasLanguages = repo.languagePercentages.length > 0;
  const dominantLang = repo.languagePercentages[0];

  return (
    <div
      className={`rounded-2xl border bg-surface transition-colors h-full flex flex-col ${
        isExcluded ? "border-warning/40 opacity-60" : "border-hairline hover:border-hairline-strong"
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[15px] font-medium text-fg hover:text-accent-text transition-colors truncate"
            >
              {repo.name}
            </a>
            {repo.private && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-panel text-faint shrink-0">private</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-muted tnum mr-1">
              <span className="inline-flex items-center gap-1" title="★">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.56.56 0 011.04 0l2.12 4.3 4.74.69a.56.56 0 01.31.96l-3.43 3.34.81 4.73a.56.56 0 01-.82.59L12 16.9l-4.24 2.23a.56.56 0 01-.82-.59l.81-4.73-3.43-3.34a.56.56 0 01.31-.96l4.74-.69z" />
                </svg>
                {repo.stargazers_count}
              </span>
              <span className="inline-flex items-center gap-1" title="fork">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="19" r="2" />
                  <path strokeLinecap="round" d="M6 7v2a3 3 0 003 3h6a3 3 0 003-3V7M12 14v3" />
                </svg>
                {repo.forks_count}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleExclude(repo.name); }}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                isExcluded ? "text-warning hover:bg-warning-soft" : "text-faint hover:bg-danger-soft hover:text-danger"
              }`}
              title={isExcluded ? t("repo.include") : t("repo.exclude")}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                {isExcluded
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
              </svg>
            </button>
          </div>
        </div>

        {repo.description && (
          <p className="text-sm text-muted mt-1.5 line-clamp-2">{repo.description}</p>
        )}

        {/* Signature segment bar */}
        {hasLanguages ? (
          <div className="mt-auto pt-4">
            <SegmentBar segments={repo.languagePercentages} height={10} max={6} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
              {repo.languagePercentages.slice(0, 3).map((lang, i) => (
                <span key={lang.name} className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-2 h-2 rounded-full" style={{ background: getLanguageColor(lang.name, i) }} />
                  {lang.name} <span className="text-faint tnum">{lang.value}%</span>
                </span>
              ))}
              {repo.languagePercentages.length > 3 && (
                <span className="text-xs text-faint">+{repo.languagePercentages.length - 3}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-4 text-xs text-faint italic">{t("repo.noLangs")}</div>
        )}

        {/* Meta + expand */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-hairline">
          <div className="flex items-center gap-x-2 text-xs text-faint min-w-0">
            <span className="tnum">{formatBytes(repo.totalBytes)}</span>
            {dominantLang && <><span className="text-hairline-strong">·</span><span className="truncate">{formatDate(repo.updated_at)}</span></>}
          </div>
          {hasLanguages && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors cursor-pointer shrink-0"
            >
              {expanded ? t("repo.commitHistory.hide") : t("repo.langs")}
              <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && hasLanguages && (
        <div className="border-t border-hairline p-4 bg-panel rounded-b-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {repo.languagePercentages.map((lang, i) => (
              <div key={lang.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getLanguageColor(lang.name, i) }} />
                <span className="text-fg w-24 truncate">{lang.name}</span>
                <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(lang.value, 0.5)}%`, background: getLanguageColor(lang.name, i) }} />
                </div>
                <span className="tnum text-xs text-muted w-12 text-right">{lang.value}%</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-hairline flex flex-wrap items-center gap-2">
            <Link
              href={`/repo/${owner}/${repo.name}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-soft text-accent-text text-xs font-medium hover:bg-accent-soft/70 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              {t("dash.openDeepDive")}
            </Link>
            <button
              type="button"
              onClick={loadCommitHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline text-muted text-xs font-medium hover:text-fg hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
            >
              {historyLoading ? t("progress.loading") : showHistory && commitHistory ? t("repo.commitHistory.hide") : t("repo.commitHistory.load")}
            </button>
          </div>

          {historyError && <p className="text-danger text-xs mt-2">{historyError}</p>}
          {showHistory && commitHistory && <div className="mt-4"><CommitHistory history={commitHistory} /></div>}
        </div>
      )}
    </div>
  );
}
