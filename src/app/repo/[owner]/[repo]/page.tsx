"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ErrorNotice from "@/components/ui/ErrorNotice";
import RepoDeepDive from "@/components/RepoDeepDive";
import WatchButton from "@/components/WatchButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "@/components/LocaleProvider";
import { codeFromResponse, toErrorCode, type ErrorCode } from "@/lib/errors";
import { tokenHeaders } from "@/lib/token";
import type { RepoDeepAnalysis } from "@/lib/github";

/** Repo detail. The frame (header, search, nav) comes from the app layout, so
 *  this page only owns its own breadcrumb, actions and content. */
export default function RepoDetailPage({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = use(params);
  const { t } = useLocale();
  const [data, setData] = useState<RepoDeepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);
    try {
      const qs = new URLSearchParams({ owner, repo });
      const res = await fetch(`/api/repo-analysis?${qs}`, { headers: tokenHeaders() });
      const payload = await res.json();
      if (!res.ok) {
        setErrorCode(codeFromResponse(payload, res.status));
        return;
      }
      setData(payload as RepoDeepAnalysis);
    } catch (err) {
      setErrorCode(toErrorCode(err));
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 t-caption text-faint min-w-0">
          <Link
            href={`/?user=${encodeURIComponent(owner)}`}
            className="hover:text-fg transition-colors font-mono truncate"
          >
            {owner}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-fg font-mono truncate">{repo}</span>
        </div>
        <div className="flex items-center gap-2">
          <WatchButton type="repo" label={`${owner}/${repo}`} size="sm" />
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            {t("action.openOnGithub")}
          </a>
        </div>
      </nav>

      {loading && (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-24 rounded-card" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-card" />
        </div>
      )}

      {errorCode && !loading && <ErrorNotice code={errorCode} onRetry={load} />}

      {data && !loading && !errorCode && <RepoDeepDive data={data} />}
    </div>
  );
}
