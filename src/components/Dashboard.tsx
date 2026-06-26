"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes, formatRelative, getLanguageColor } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { UserAnalysis, RepoDeepAnalysis } from "@/lib/github";
import {
  listWatches,
  getSnapshots,
  getLatestSnapshot,
  saveSnapshot,
  removeWatch,
  computeDiff,
  buildUserSnapshotData,
  buildRepoSnapshotData,
  type WatchItem,
  type Snapshot,
  type WatchDiff,
  type UserSnapshotData,
  type RepoSnapshotData,
} from "@/lib/watchlist";

interface ItemState {
  watch: WatchItem;
  snapshots: Snapshot[];
  diff: WatchDiff | null;
  baseline: boolean; // only one snapshot exists → no diff yet
  checking: boolean;
  error: string | null;
}

interface DashboardProps {
  onAnalyzeUser: (login: string) => void;
}

const BYTE_METRICS = new Set(["totalBytes"]);

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("repo-monitor-gh-token") || "";
}

export default function Dashboard({ onAnalyzeUser }: DashboardProps) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<ItemState[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const watches = await listWatches();
    const states = await Promise.all(
      watches.map(async (watch) => {
        const snapshots = await getSnapshots(watch.id);
        let diff: WatchDiff | null = null;
        if (snapshots.length >= 2) {
          diff = computeDiff(snapshots[snapshots.length - 2], snapshots[snapshots.length - 1]);
        }
        return {
          watch,
          snapshots,
          diff,
          baseline: snapshots.length === 1,
          checking: false,
          error: null,
        } satisfies ItemState;
      })
    );
    if (mounted.current) {
      setItems(states);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const checkOne = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((it) => (it.watch.id === id ? { ...it, checking: true, error: null } : it))
      );
      const item = items.find((it) => it.watch.id === id);
      if (!item) return;
      const token = getToken();

      try {
        const prevSnap = await getLatestSnapshot(id);
        let snapshot: Omit<Snapshot, "id">;

        if (item.watch.type === "user") {
          const res = await fetch(
            `/api/analyze?username=${encodeURIComponent(item.watch.label)}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || t("dash.error"));
          snapshot = {
            watchId: id,
            type: "user",
            timestamp: Date.now(),
            data: buildUserSnapshotData(data as UserAnalysis),
          };
        } else {
          const [owner, repo] = item.watch.label.split("/");
          const params = new URLSearchParams({ owner, repo });
          if (token) params.set("token", token);
          const res = await fetch(`/api/repo-analysis?${params}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || t("dash.error"));
          snapshot = {
            watchId: id,
            type: "repo",
            timestamp: Date.now(),
            data: buildRepoSnapshotData(data as RepoDeepAnalysis),
          };
        }

        await saveSnapshot(snapshot);
        const snapshots = await getSnapshots(id);
        const diff =
          prevSnap != null
            ? computeDiff(prevSnap, { ...snapshot } as Snapshot)
            : null;

        if (mounted.current) {
          setItems((prev) =>
            prev.map((it) =>
              it.watch.id === id
                ? {
                    ...it,
                    snapshots,
                    diff,
                    baseline: snapshots.length === 1,
                    checking: false,
                    error: null,
                  }
                : it
            )
          );
        }
      } catch (err: unknown) {
        if (mounted.current) {
          setItems((prev) =>
            prev.map((it) =>
              it.watch.id === id
                ? {
                    ...it,
                    checking: false,
                    error: err instanceof Error ? err.message : t("dash.error"),
                  }
                : it
            )
          );
        }
      }
    },
    [items, t]
  );

  const checkAll = useCallback(async () => {
    setCheckingAll(true);
    // Sequential to be gentle on the rate limit.
    for (const it of items) {
      await checkOne(it.watch.id);
    }
    setCheckingAll(false);
  }, [items, checkOne]);

  const handleRemove = useCallback(async (id: string) => {
    await removeWatch(id);
    setItems((prev) => prev.filter((it) => it.watch.id !== id));
  }, []);

  if (!loaded) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="animate-spin h-6 w-6 mx-auto" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("dash.title")}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("dash.subtitle")}</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={checkAll}
            disabled={checkingAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {checkingAll ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("dash.checking")}
              </>
            ) : (
              <>🔄 {t("dash.refreshAll")}</>
            )}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto px-4">{t("dash.empty")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((it) => (
            <WatchCard
              key={it.watch.id}
              item={it}
              locale={locale}
              t={t}
              onCheck={() => checkOne(it.watch.id)}
              onRemove={() => handleRemove(it.watch.id)}
              onAnalyzeUser={onAnalyzeUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 90;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const rising = values[values.length - 1] >= values[0];
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={rising ? "#10b981" : "#ef4444"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function deltaStr(key: string, delta: number): string {
  const sign = delta > 0 ? "+" : "";
  if (BYTE_METRICS.has(key)) {
    return (delta > 0 ? "+" : "-") + formatBytes(Math.abs(delta));
  }
  return sign + delta.toLocaleString();
}

function sparkValues(item: ItemState): number[] {
  if (item.watch.type === "user") {
    return item.snapshots.map((s) => (s.data as UserSnapshotData).totalStars);
  }
  return item.snapshots.map((s) => (s.data as RepoSnapshotData).stars);
}

function WatchCard({
  item,
  locale,
  t,
  onCheck,
  onRemove,
  onAnalyzeUser,
}: {
  item: ItemState;
  locale: "tr" | "en";
  t: (k: TranslationKey) => string;
  onCheck: () => void;
  onRemove: () => void;
  onAnalyzeUser: (login: string) => void;
}) {
  const { watch, diff, baseline, checking, error, snapshots } = item;
  const last = snapshots[snapshots.length - 1];
  const isRepo = watch.type === "repo";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {watch.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={watch.avatarUrl} alt={watch.label} className="w-10 h-10 rounded-full shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg shrink-0">
              {isRepo ? "📦" : "👤"}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 dark:text-gray-100 truncate">{watch.label}</span>
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {isRepo ? "repo" : "user"}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t("dash.lastChecked")}:{" "}
              {last ? formatRelative(last.timestamp, locale) : t("dash.never")}
              {snapshots.length > 0 && (
                <span className="ml-2">· {snapshots.length} {t("dash.snapshots")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Sparkline values={sparkValues(item)} />
          <button
            onClick={onCheck}
            disabled={checking}
            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer disabled:opacity-50 font-medium"
          >
            {checking ? t("dash.checking") : t("dash.checkNow")}
          </button>
          {isRepo ? (
            <Link
              href={`/repo/${watch.label}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors cursor-pointer font-medium"
            >
              {t("dash.openDeepDive")}
            </Link>
          ) : (
            <button
              onClick={() => onAnalyzeUser(watch.label)}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-200 transition-colors cursor-pointer font-medium"
            >
              {t("dash.viewProfile")}
            </button>
          )}
          <button
            onClick={onRemove}
            title={t("dash.remove")}
            className="text-xs p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Diff / status row */}
      <div className="mt-4">
        {error && <p className="text-sm text-red-500">❌ {error}</p>}

        {!error && baseline && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{t("dash.baseline")}</p>
        )}

        {!error && !baseline && diff && !diff.hasChanges && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("dash.noChanges")}</p>
        )}

        {!error && diff && diff.hasChanges && (
          <div className="flex flex-wrap items-center gap-2">
            {diff.newReleaseTag && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                {t("dash.newRelease")} {diff.newReleaseTag}
              </span>
            )}
            {diff.addedRepos.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                +{diff.addedRepos.length} {t("dash.newRepos")}
              </span>
            )}
            {diff.removedRepos.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                −{diff.removedRepos.length} {t("dash.removedRepos")}
              </span>
            )}
            {diff.metrics.map((m) => (
              <span
                key={m.key}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  m.delta > 0
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
                }`}
              >
                {t(`metric.${m.key}` as TranslationKey)} {deltaStr(m.key, m.delta)}
              </span>
            ))}
            {diff.languageShifts.slice(0, 3).map((s) => (
              <span
                key={s.name}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 inline-flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(s.name, 0) }} />
                {s.name} {s.before.toFixed(0)}%→{s.after.toFixed(0)}%
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
