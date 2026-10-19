"use client";

import { useState } from "react";
import Link from "next/link";
import CommitHistory from "@/components/CommitHistory";
import SegmentBar from "@/components/SegmentBar";
import WatchButton from "@/components/WatchButton";
import Avatar from "@/components/ui/Avatar";
import { useLocale } from "@/components/LocaleProvider";
import useFormat from "@/components/useFormat";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import { getRepoActivityDate } from "@/lib/repo-activity";
import {
  codeFromResponse,
  errorTitleKey,
  toErrorCode,
  type ErrorCode,
} from "@/lib/errors";
import { tokenHeaders } from "@/lib/token";
import type { RepoCommitHistory, RepoInfo } from "@/lib/github";

/** One repository. Collapsed it answers "how big, how active, what language";
 *  expanded it carries the full language list, the commit timeline and the link
 *  into the deep dive. */
export default function RepoCard({
  repo,
  owner,
  isExcluded,
  onToggleExclude,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  repo: RepoInfo;
  owner: string;
  isExcluded: boolean;
  onToggleExclude: (name: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (name: string) => void;
}) {
  const { t } = useLocale();
  const fmt = useFormat();
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<RepoCommitHistory | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<ErrorCode | null>(null);

  const metrics = repo.advancedMetrics;
  const hasLanguages = repo.languagePercentages.length > 0;
  const activityDate = getRepoActivityDate(repo);

  const loadHistory = async () => {
    if (history) {
      setHistoryOpen((v) => !v);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryOpen(true);
    try {
      const params = new URLSearchParams({ owner, repo: repo.name });
      const res = await fetch(`/api/commit-history?${params}`, { headers: tokenHeaders() });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setHistoryError(codeFromResponse(payload, res.status));
        return;
      }
      setHistory((await res.json()) as RepoCommitHistory);
    } catch (err: unknown) {
      setHistoryError(toErrorCode(err));
    } finally {
      setHistoryLoading(false);
    }
  };

  const repoOwner = repo.ownerLogin || owner;
  const repoFullName = repo.fullName || (repo.ownerLogin ? `${repo.ownerLogin}/${repo.name}` : repo.name);

  return (
    <article
      className={`card flex flex-col h-full transition-colors ${
        isExcluded ? "opacity-55 border-warning/40" : "hover:border-hairline-strong"
      }`}
    >
      <div className="p-4 flex-1 flex flex-col">
        <header className="flex items-start gap-2">
          {selectionMode && (
            <button
              type="button"
              data-repo-checkbox
              onClick={() => onToggleSelect?.(repoFullName)}
              aria-pressed={selected}
              aria-label={repoFullName}
              className={`mt-0.5 shrink-0 w-4 h-4 rounded border grid place-items-center cursor-pointer transition-colors ${
                selected
                  ? "bg-accent border-accent text-accent-fg"
                  : "border-hairline-strong hover:border-accent"
              }`}
            >
              {selected && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {repo.ownerAvatar && (
                <Avatar
                  src={repo.ownerAvatar}
                  label={repoOwner}
                  size={16}
                  rounded="full"
                />
              )}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                title={repoFullName}
                className="t-small font-medium text-fg hover:text-accent-text transition-colors truncate font-mono"
              >
                {repoFullName}
              </a>
              {repo.private && (
                <span className="t-caption px-1.5 rounded bg-panel text-faint shrink-0">
                  {t("repo.private")}
                </span>
              )}
              {repo.isContributed && (
                <span className="t-caption px-1.5 py-0.5 rounded bg-accent-soft text-accent-text shrink-0 text-[10px] font-medium leading-none">
                  {t("repo.contributed")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 t-caption text-muted tnum">
            <Stat title={t("metric.stars")} value={repo.stargazers_count}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.5a.56.56 0 011.04 0l2.12 4.3 4.74.69a.56.56 0 01.31.96l-3.43 3.34.81 4.73a.56.56 0 01-.82.59L12 16.9l-4.24 2.23a.56.56 0 01-.82-.59l.81-4.73-3.43-3.34a.56.56 0 01.31-.96l4.74-.69z"
              />
            </Stat>
            <Stat title={t("metric.forks")} value={repo.forks_count}>
              <>
                <circle cx="6" cy="5" r="2" />
                <circle cx="18" cy="5" r="2" />
                <circle cx="12" cy="19" r="2" />
                <path strokeLinecap="round" d="M6 7v2a3 3 0 003 3h6a3 3 0 003-3V7M12 14v3" />
              </>
            </Stat>
            {!repo.isContributed && (
              <button
                type="button"
                onClick={() => onToggleExclude(repo.name)}
                title={isExcluded ? t("repo.include") : t("repo.exclude")}
                aria-label={isExcluded ? t("repo.include") : t("repo.exclude")}
                className={`p-1 -m-1 rounded transition-colors cursor-pointer ${
                  isExcluded ? "text-warning" : "text-faint hover:text-danger"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  {isExcluded ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.22A10.48 10.48 0 001.93 12C3.23 16.34 7.24 19.5 12 19.5c.99 0 1.95-.14 2.86-.4M6.23 6.23A10.45 10.45 0 0112 4.5c4.76 0 8.77 3.16 10.07 7.5a10.52 10.52 0 01-4.3 5.77M6.23 6.23L3 3m3.23 3.23l3.65 3.65m7.89 7.89L21 21m-3.23-3.23l-3.65-3.65m0 0a3 3 0 10-4.24-4.24m4.24 4.24L9.88 9.88"
                    />
                  ) : (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.04 12.32a1 1 0 010-.64C3.42 7.51 7.36 4.5 12 4.5s8.57 3.01 9.96 7.18a1 1 0 010 .64C20.58 16.49 16.64 19.5 12 19.5s-8.57-3.01-9.96-7.18z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        </header>

        {repo.description && (
          <p className="t-caption text-muted mt-1.5 line-clamp-2">{repo.description}</p>
        )}

        {hasLanguages ? (
          <div className="mt-auto pt-3.5">
            <SegmentBar segments={repo.languagePercentages} height={8} max={6} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {repo.languagePercentages.slice(0, 3).map((lang, i) => (
                <span key={lang.name} className="inline-flex items-center gap-1.5 t-caption text-muted">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: getLanguageColor(lang.name, i) }}
                  />
                  {lang.name}
                  <span className="text-faint tnum">{lang.value}%</span>
                </span>
              ))}
              {repo.languagePercentages.length > 3 && (
                <span className="t-caption text-faint tnum">
                  +{repo.languagePercentages.length - 3}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-auto pt-3.5 t-caption text-faint">{t("repo.noLangs")}</p>
        )}

        <footer className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-hairline">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 t-caption text-faint tnum min-w-0">
            <span>{formatBytes(repo.totalBytes)}</span>
            <span aria-hidden>·</span>
            <span title={`${t("repo.updatedAt")}: ${fmt.date(activityDate)}`}>
              {fmt.date(activityDate)}
            </span>
            {metrics && metrics.totalCommits > 0 && (
              <>
                <span aria-hidden>·</span>
                <span title={t("metric.totalCommits")}>
                  {fmt.num(metrics.totalCommits)} {t("repo.commitsShort")}
                  {metrics.commitsLastMonth > 0 && (
                    <span className="text-accent-text font-medium"> +{fmt.num(metrics.commitsLastMonth)}</span>
                  )}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 t-caption text-muted hover:text-fg transition-colors cursor-pointer shrink-0"
          >
            {t("repo.details")}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </footer>
      </div>

      {expanded && (
        <div className="border-t border-hairline bg-panel/60 p-4 rounded-b-card">
          {hasLanguages && (
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-1.5">
              {repo.languagePercentages.map((lang, i) => (
                <div key={lang.name} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: getLanguageColor(lang.name, i) }}
                  />
                  <span className="t-caption text-fg w-20 truncate">{lang.name}</span>
                  <span className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.max(lang.value, 0.5)}%`,
                        background: getLanguageColor(lang.name, i),
                      }}
                    />
                  </span>
                  <span className="t-caption text-muted tnum w-11 text-right">{lang.value}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link href={`/repo/${repoOwner}/${repo.name}`} className="btn btn-soft btn-sm">
              {t("repo.deepDive")}
            </Link>
            <button
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              className="btn btn-ghost btn-sm"
            >
              {historyLoading
                ? t("progress.loading")
                : historyOpen && history
                  ? t("repo.commitHistory.hide")
                  : t("repo.commitHistory.load")}
            </button>
            <WatchButton type="repo" label={repoFullName} size="sm" />
          </div>

          {historyError && (
            <p className="t-caption text-danger mt-2">{t(errorTitleKey(historyError))}</p>
          )}
          {historyOpen && history && (
            <div className="mt-4">
              <CommitHistory history={history} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Stat({
  title,
  value,
  children,
}: {
  title: string;
  value: number;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
        {children}
      </svg>
      {value}
    </span>
  );
}
