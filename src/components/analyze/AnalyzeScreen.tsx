"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AnalyzeSkeleton from "@/components/analyze/AnalyzeSkeleton";
import LanguageDna from "@/components/analyze/LanguageDna";
import MetricGrid from "@/components/analyze/MetricGrid";
import ProfileSummary from "@/components/analyze/ProfileSummary";
import RepoGrid from "@/components/analyze/RepoGrid";
import SecondaryPanels from "@/components/analyze/SecondaryPanels";
import ErrorNotice from "@/components/ui/ErrorNotice";
import { useLocale } from "@/components/LocaleProvider";
import { useSession } from "@/components/SessionProvider";
import {
  clearAnalysis,
  getCustomExtensionsRaw,
  readAny,
  readFresh,
  writeAnalysis,
} from "@/lib/analysis-cache";
import { codeFromResponse, isErrorCode, toErrorCode, type ErrorCode } from "@/lib/errors";
import { addRecentSearch, getLastUser } from "@/lib/recent";
import { buildSampleAnalysis } from "@/lib/sample-analysis";
import { getStoredToken, tokenHeaders } from "@/lib/token";
import { FOCUS_SEARCH_EVENT } from "@/lib/ui-events";
import type { UserAnalysis } from "@/lib/github";

type Source = "live" | "cache" | "sample";

interface Progress {
  current: number;
  total: number;
  repoName: string;
}

/** The Analyze screen — the app's main surface.
 *
 *  Opening rules, in order:
 *    1. `?user=` present  → analyze it
 *    2. signed in         → analyze the visitor's own profile
 *    3. seen someone before → reopen that profile
 *    4. nothing at all    → render the full layout filled with sample data
 *
 *  A rate-limited request falls back to the last cached result plus a banner
 *  carrying the sign-in / token action. No path ends in an empty screen. */
export default function AnalyzeScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();

  const userParam = searchParams.get("user")?.trim() ?? "";

  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null);
  const [source, setSource] = useState<Source>("sample");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const ranFor = useRef<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const sample = useMemo(() => buildSampleAnalysis(), []);

  const run = useCallback(
    async (username: string, force = false) => {
      ranFor.current = username.toLowerCase();
      setLoading(true);
      setErrorCode(null);
      setProgress(null);
      setExcluded(new Set());

      const isOwnProfile = session.user?.login.toLowerCase() === username.toLowerCase();

      if (force) clearAnalysis(username);

      // Owner analyses can include private repos, so their results are never
      // served from the shared browser cache.
      if (!force && !isOwnProfile) {
        const hit = readFresh(username);
        if (hit) {
          setAnalysis(hit.data);
          setSource("cache");
          setCachedAt(hit.timestamp);
          setLoading(false);
          addRecentSearch(username, hit.data.user.avatar_url);
          return;
        }
      }

      try {
        const params = new URLSearchParams({ username });
        const extensions = getCustomExtensionsRaw();
        if (extensions) params.set("extensions", extensions);

        const res = await fetch(`/api/analyze-stream?${params}`, { headers: tokenHeaders() });
        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => null);
          throw Object.assign(new Error("analyze"), {
            appCode: codeFromResponse(payload, res.status),
          });
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const trimmed = chunk.trim();
            if (!trimmed) continue;
            let event = "";
            let raw = "";
            for (const line of trimmed.split("\n")) {
              if (line.startsWith("event: ")) event = line.slice(7).trim();
              else if (line.startsWith("data: ")) raw += line.slice(6);
            }
            if (!raw) continue;

            let payload: unknown;
            try {
              payload = JSON.parse(raw);
            } catch {
              continue;
            }

            if (event === "progress") {
              setProgress(payload as Progress);
            } else if (event === "complete") {
              const data = payload as UserAnalysis;
              writeAnalysis(username, data);
              setAnalysis(data);
              setSource("live");
              setCachedAt(null);
              addRecentSearch(username, data.user?.avatar_url);
            } else if (event === "error") {
              const code = (payload as { code?: string }).code ?? "";
              throw Object.assign(new Error("analyze"), {
                appCode: isErrorCode(code) ? code : "unknown",
              });
            }
          }
        }
      } catch (err: unknown) {
        const code = (err as { appCode?: ErrorCode }).appCode ?? toErrorCode(err);
        setErrorCode(code);
        // Quota exhausted: show the most recent numbers we already hold rather
        // than replacing the screen with an error.
        const fallback = readAny(username);
        if (fallback) {
          setAnalysis(fallback.data);
          setSource("cache");
          setCachedAt(fallback.timestamp);
        } else {
          setAnalysis(null);
          setSource("sample");
        }
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [session.user]
  );

  // Resolve what to show on this visit.
  useEffect(() => {
    if (userParam) {
      if (ranFor.current !== userParam.toLowerCase()) run(userParam);
      return;
    }
    if (session.loading) return;
    const fallback = session.user?.login ?? getLastUser();
    if (fallback) {
      router.replace(`/?user=${encodeURIComponent(fallback)}`);
      return;
    }
    ranFor.current = null;
    setAnalysis(null);
    setSource("sample");
  }, [userParam, session.loading, session.user, run, router]);

  const toggleExclude = useCallback((name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const shown = analysis ?? sample;
  const isSample = !analysis;

  // Excluding a repository re-derives the language totals it fed into.
  const { repos, languages, totalBytes } = useMemo(() => {
    const active = shown.repos.filter((r) => !excluded.has(r.name));
    const bytesByLang: Record<string, number> = {};
    let total = 0;
    for (const repo of active) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        bytesByLang[lang] = (bytesByLang[lang] ?? 0) + bytes;
        total += bytes;
      }
    }
    const langs = Object.entries(bytesByLang)
      .map(([name, bytes]) => ({
        name,
        value: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
        bytes,
      }))
      .sort((a, b) => b.bytes - a.bytes);
    return { repos: active, languages: langs, totalBytes: total };
  }, [shown, excluded]);

  const exportPng = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark")
          ? "#09090b"
          : "#fafafa",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${shown.user.login}-repo-monitor.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // export is a convenience; failing it must not disturb the page
    } finally {
      setExporting(false);
    }
  }, [shown.user.login]);

  if (loading && !analysis) {
    return (
      <div className="space-y-4">
        <ProgressBar progress={progress} label={t("progress.analyzing")} />
        <AnalyzeSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* State strip: one row, one message, one action */}
      {errorCode && (
        <ErrorNotice
          code={errorCode}
          inline={Boolean(analysis)}
          onRetry={userParam ? () => run(userParam, true) : undefined}
        />
      )}

      {!errorCode && source === "cache" && cachedAt && (
        <div className="rounded-lg border border-hairline bg-panel px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="t-caption text-muted">{t("cache.loaded")}</p>
          <button
            type="button"
            onClick={() => run(shown.user.login, true)}
            className="btn btn-ghost btn-sm"
          >
            {t("cache.refresh")}
          </button>
        </div>
      )}

      {isSample && (
        <div className="rounded-lg border border-accent-line bg-accent-soft px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="t-caption text-accent-text">{t("sample.notice")}</p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT))}
            className="btn btn-primary btn-sm"
          >
            {t("sample.action")}
          </button>
        </div>
      )}

      {loading && analysis && <ProgressBar progress={progress} label={t("progress.analyzing")} />}

      <div className={isSample ? "sample-dim" : undefined} aria-hidden={isSample || undefined}>
        <div className="space-y-4">
          <div ref={exportRef} className="space-y-4">
            <ProfileSummary
              analysis={shown}
              totalBytes={totalBytes}
              languages={languages}
              isSample={isSample}
              onExport={isSample ? undefined : exportPng}
              exporting={exporting}
            />
            <LanguageDna languages={languages} />
            <MetricGrid
              repos={repos}
              totalBytes={totalBytes}
              languageCount={languages.length}
            />
          </div>

          <RepoGrid
            repos={shown.repos}
            languages={languages}
            owner={shown.user.login}
            excluded={excluded}
            onToggleExclude={toggleExclude}
            onClearExclusions={() => setExcluded(new Set())}
            allowExport={!isSample}
            isSample={isSample}
          />

          {!isSample && <SecondaryPanels analysis={shown} token={getStoredToken()} />}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress, label }: { progress: Progress | null; label: string }) {
  const pct = progress ? Math.round((progress.current / Math.max(progress.total, 1)) * 100) : null;
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="t-caption text-fg font-medium">
          {label}
          {progress && (
            <span className="text-faint tnum">
              {" "}
              {progress.current}/{progress.total}
            </span>
          )}
        </span>
        {progress && <span className="t-caption text-faint tnum">{pct}%</span>}
      </div>
      <div className="mt-2 h-1 rounded-full bg-panel overflow-hidden">
        <div
          className={`h-full rounded-full bg-accent ${pct === null ? "w-1/4 animate-pulse" : "transition-all"}`}
          style={pct === null ? undefined : { width: `${pct}%` }}
        />
      </div>
      {progress?.repoName && (
        <p className="t-caption text-faint font-mono truncate mt-1.5">{progress.repoName}</p>
      )}
    </div>
  );
}
