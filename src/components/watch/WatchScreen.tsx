"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLocale } from "@/components/LocaleProvider";
import { errorTitleKey, codeFromResponse, toErrorCode, type ErrorCode } from "@/lib/errors";
import type { TranslationKey } from "@/lib/i18n";
import { formatBytes, formatRelative, getLanguageColor } from "@/lib/utils";
import useFormat from "@/components/useFormat";
import { tokenHeaders } from "@/lib/token";
import { FOCUS_SEARCH_EVENT } from "@/lib/ui-events";
import type { RepoDeepAnalysis, UserAnalysis } from "@/lib/github";
import {
  buildRepoSnapshotData,
  buildUserSnapshotData,
  computeDiff,
  getLatestSnapshot,
  getSnapshots,
  listWatches,
  removeWatch,
  saveSnapshot,
  type RepoSnapshotData,
  type Snapshot,
  type UserSnapshotData,
  type WatchDiff,
  type WatchItem,
} from "@/lib/watchlist";

interface ItemState {
  watch: WatchItem;
  snapshots: Snapshot[];
  diff: WatchDiff | null;
  baseline: boolean;
  checking: boolean;
  error: ErrorCode | null;
}

const BYTE_METRICS = new Set(["totalBytes"]);

/** The Watch screen: what changed since the last check, per tracked item.
 *
 *  Strictly about change over time — the current-state read lives on Analyze,
 *  so the two screens never say the same thing twice. */
export default function WatchScreen() {
  const { t, locale } = useLocale();
  const [items, setItems] = useState<ItemState[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const watches = await listWatches().catch(() => [] as WatchItem[]);
    const states = await Promise.all(
      watches.map(async (watch) => {
        const snapshots = await getSnapshots(watch.id);
        return {
          watch,
          snapshots,
          diff:
            snapshots.length >= 2
              ? computeDiff(snapshots[snapshots.length - 2], snapshots[snapshots.length - 1])
              : null,
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
    void (async () => {
      await load();
    })();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const patch = (id: string, changes: Partial<ItemState>) =>
    setItems((prev) => prev.map((it) => (it.watch.id === id ? { ...it, ...changes } : it)));

  const checkOne = useCallback(
    async (id: string) => {
      const item = items.find((it) => it.watch.id === id);
      if (!item) return;
      patch(id, { checking: true, error: null });

      try {
        const previous = await getLatestSnapshot(id);
        let snapshot: Omit<Snapshot, "id">;

        if (item.watch.type === "user") {
          const res = await fetch(`/api/analyze?username=${encodeURIComponent(item.watch.label)}`, {
            headers: tokenHeaders(),
          });
          const payload = await res.json();
          if (!res.ok) {
            patch(id, { checking: false, error: codeFromResponse(payload, res.status) });
            return;
          }
          snapshot = {
            watchId: id,
            type: "user",
            timestamp: Date.now(),
            data: buildUserSnapshotData(payload as UserAnalysis),
          };
        } else {
          const [owner, repo] = item.watch.label.split("/");
          const res = await fetch(
            `/api/repo-analysis?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`,
            { headers: tokenHeaders() }
          );
          const payload = await res.json();
          if (!res.ok) {
            patch(id, { checking: false, error: codeFromResponse(payload, res.status) });
            return;
          }
          snapshot = {
            watchId: id,
            type: "repo",
            timestamp: Date.now(),
            data: buildRepoSnapshotData(payload as RepoDeepAnalysis),
          };
        }

        await saveSnapshot(snapshot);
        const snapshots = await getSnapshots(id);
        if (!mounted.current) return;
        patch(id, {
          snapshots,
          diff: previous ? computeDiff(previous, snapshot as Snapshot) : null,
          baseline: snapshots.length === 1,
          checking: false,
          error: null,
        });
      } catch (err: unknown) {
        if (mounted.current) patch(id, { checking: false, error: toErrorCode(err) });
      }
    },
    [items]
  );

  const checkAll = useCallback(async () => {
    setCheckingAll(true);
    // Sequential on purpose: a burst of checks is the fastest way to burn the
    // hourly quota the rest of the app depends on.
    for (const it of items) {
      await checkOne(it.watch.id);
    }
    setCheckingAll(false);
  }, [items, checkOne]);

  const remove = useCallback(async (id: string) => {
    await removeWatch(id);
    setItems((prev) => prev.filter((it) => it.watch.id !== id));
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <SectionHeader
          title={t("watch.title")}
          count={items.length || undefined}
          hint={t("watch.subtitle")}
          right={
            items.length > 0 ? (
              <button
                type="button"
                onClick={checkAll}
                disabled={checkingAll}
                className="btn btn-primary btn-sm"
              >
                {checkingAll ? t("watch.checking") : t("watch.checkAll")}
              </button>
            ) : undefined
          }
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t("watch.empty")}
          body={t("watch.emptyBody")}
          action={
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT))}
              className="btn btn-primary btn-sm"
            >
              {t("watch.emptyCta")}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <WatchCard
              key={item.watch.id}
              item={item}
              locale={locale}
              t={t}
              onCheck={() => checkOne(item.watch.id)}
              onRemove={() => remove(item.watch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchCard({
  item,
  locale,
  t,
  onCheck,
  onRemove,
}: {
  item: ItemState;
  locale: "tr" | "en";
  t: (k: TranslationKey) => string;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const fmt = useFormat();
  const { watch, diff, baseline, checking, error, snapshots } = item;
  const last = snapshots[snapshots.length - 1];
  const isRepo = watch.type === "repo";

  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar src={watch.avatarUrl} label={watch.label} size={36} rounded={isRepo ? "lg" : "full"} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="t-small font-medium text-fg truncate font-mono">{watch.label}</span>
            <span className="t-caption px-1.5 rounded bg-panel text-faint shrink-0">
              {isRepo ? t("watch.typeRepo") : t("watch.typeUser")}
            </span>
          </div>
          <p className="t-caption text-faint mt-0.5 tnum">
            {t("watch.lastChecked")}: {last ? formatRelative(last.timestamp, locale) : t("watch.never")}
            {snapshots.length > 0 && ` · ${snapshots.length} ${t("watch.snapshots")}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Sparkline values={sparkValues(item)} />
          <button type="button" onClick={onCheck} disabled={checking} className="btn btn-soft btn-sm">
            {checking ? t("watch.checking") : t("watch.checkNow")}
          </button>
          {isRepo ? (
            <Link href={`/repo/${watch.label}`} className="btn btn-ghost btn-sm">
              {t("repo.deepDive")}
            </Link>
          ) : (
            <Link href={`/?user=${encodeURIComponent(watch.label)}`} className="btn btn-ghost btn-sm">
              {t("watch.viewProfile")}
            </Link>
          )}
          <button
            type="button"
            onClick={onRemove}
            title={t("watch.remove")}
            aria-label={t("watch.remove")}
            className="btn btn-ghost btn-sm w-8 px-0 text-faint hover:text-danger"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-hairline">
        {error ? (
          <p className="t-caption text-danger">{t(errorTitleKey(error))}</p>
        ) : baseline ? (
          <p className="t-caption text-muted">{t("watch.baseline")}</p>
        ) : !diff ? (
          <p className="t-caption text-faint">{t("watch.noBaseline")}</p>
        ) : !diff.hasChanges ? (
          <p className="t-caption text-faint">{t("watch.noChanges")}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {diff.newReleaseTag && (
              <Delta tone="accent">
                {t("watch.newRelease")} {diff.newReleaseTag}
              </Delta>
            )}
            {diff.addedRepos.length > 0 && (
              <Delta tone="up">
                +{diff.addedRepos.length} {t("watch.newRepos")}
              </Delta>
            )}
            {diff.removedRepos.length > 0 && (
              <Delta tone="down">
                −{diff.removedRepos.length} {t("watch.removedRepos")}
              </Delta>
            )}
            {diff.metrics.map((m) => (
              <Delta key={m.key} tone={m.delta > 0 ? "up" : "down"}>
                {t(`metric.${m.key}` as TranslationKey)} {deltaStr(m.key, m.delta, fmt.tag)}
              </Delta>
            ))}
            {diff.languageShifts.slice(0, 3).map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1.5 h-6 px-2 rounded-pill bg-panel t-caption text-muted tnum"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: getLanguageColor(s.name, 0) }}
                />
                {s.name} {s.before.toFixed(0)}→{s.after.toFixed(0)}%
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Delta({
  tone,
  children,
}: {
  tone: "up" | "down" | "accent";
  children: React.ReactNode;
}) {
  const cls =
    tone === "up"
      ? "bg-success-soft text-success"
      : tone === "down"
        ? "bg-danger-soft text-danger"
        : "bg-accent-soft text-accent-text";
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-pill t-caption font-medium tnum ${cls}`}>
      {children}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 72;
  const h = 22;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const rising = values[values.length - 1] >= values[0];
  return (
    <svg width={w} height={h} className="hidden sm:block shrink-0" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={rising ? "var(--success)" : "var(--danger)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function sparkValues(item: ItemState): number[] {
  if (item.watch.type === "user") {
    return item.snapshots.map((s) => (s.data as UserSnapshotData).totalStars);
  }
  return item.snapshots.map((s) => (s.data as RepoSnapshotData).stars);
}

function deltaStr(key: string, delta: number, numberTag: string): string {
  if (BYTE_METRICS.has(key)) {
    return (delta > 0 ? "+" : "−") + formatBytes(Math.abs(delta));
  }
  return (delta > 0 ? "+" : "") + delta.toLocaleString(numberTag);
}
