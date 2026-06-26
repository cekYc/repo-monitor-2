// Client-side watchlist + snapshot store (IndexedDB).
// Powers the "Monitor" half of the app: track a user or repo over time and
// diff each check against the previous snapshot. No backend required.

import type { UserAnalysis, RepoDeepAnalysis } from "./github";

export type WatchType = "user" | "repo";

export interface WatchItem {
  id: string; // "user:login" | "repo:owner/name" (lowercased)
  type: WatchType;
  label: string; // display label: "login" or "owner/name"
  avatarUrl?: string;
  addedAt: number;
}

export interface UserSnapshotData {
  repoCount: number;
  totalStars: number;
  totalForks: number;
  totalBytes: number;
  followers: number;
  following: number;
  topLanguages: { name: string; value: number }[]; // top languages, %
  repoNames: string[];
}

export interface RepoSnapshotData {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPRs: number;
  sizeKb: number;
  pushedAt: string;
  recentCommits: number; // commits in the recent window
  topLanguages: { name: string; value: number }[];
  latestReleaseTag: string | null;
  latestReleaseAt: string | null;
  releaseCount: number;
  contributorCount: number;
}

export type SnapshotData = UserSnapshotData | RepoSnapshotData;

export interface Snapshot {
  id?: number; // autoincrement
  watchId: string;
  type: WatchType;
  timestamp: number;
  data: SnapshotData;
}

// ---------------------------------------------------------------------------
// IndexedDB plumbing
// ---------------------------------------------------------------------------

const DB_NAME = "repo-monitor-db";
const DB_VERSION = 1;
const STORE_WATCHES = "watches";
const STORE_SNAPSHOTS = "snapshots";
const MAX_SNAPSHOTS_PER_ITEM = 60;

function isBrowser(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_WATCHES)) {
        db.createObjectStore(STORE_WATCHES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        const snap = db.createObjectStore(STORE_SNAPSHOTS, {
          keyPath: "id",
          autoIncrement: true,
        });
        snap.createIndex("watchId", "watchId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

// ---------------------------------------------------------------------------
// Watch CRUD
// ---------------------------------------------------------------------------

export function makeWatchId(type: WatchType, label: string): string {
  return `${type}:${label.toLowerCase()}`;
}

export async function addWatch(
  item: Omit<WatchItem, "addedAt"> & { addedAt?: number }
): Promise<WatchItem> {
  const record: WatchItem = { ...item, addedAt: item.addedAt ?? Date.now() };
  await tx(STORE_WATCHES, "readwrite", (s) => s.put(record));
  return record;
}

export async function removeWatch(id: string): Promise<void> {
  await tx(STORE_WATCHES, "readwrite", (s) => s.delete(id));
  // Drop the item's snapshots too.
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_SNAPSHOTS, "readwrite");
    const index = transaction.objectStore(STORE_SNAPSHOTS).index("watchId");
    const cursorReq = index.openCursor(IDBKeyRange.only(id));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function listWatches(): Promise<WatchItem[]> {
  if (!isBrowser()) return [];
  const all = await tx<WatchItem[]>(STORE_WATCHES, "readonly", (s) =>
    s.getAll()
  );
  return all.sort((a, b) => b.addedAt - a.addedAt);
}

export async function isWatched(id: string): Promise<boolean> {
  if (!isBrowser()) return false;
  const found = await tx<WatchItem | undefined>(STORE_WATCHES, "readonly", (s) =>
    s.get(id)
  );
  return !!found;
}

// ---------------------------------------------------------------------------
// Snapshot CRUD
// ---------------------------------------------------------------------------

export async function saveSnapshot(snap: Omit<Snapshot, "id">): Promise<void> {
  await tx(STORE_SNAPSHOTS, "readwrite", (s) => s.add(snap));
  await pruneSnapshots(snap.watchId);
}

export async function getSnapshots(watchId: string): Promise<Snapshot[]> {
  if (!isBrowser()) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SNAPSHOTS, "readonly");
    const index = transaction.objectStore(STORE_SNAPSHOTS).index("watchId");
    const req = index.getAll(IDBKeyRange.only(watchId));
    req.onsuccess = () =>
      resolve((req.result as Snapshot[]).sort((a, b) => a.timestamp - b.timestamp));
    req.onerror = () => reject(req.error);
  });
}

export async function getLatestSnapshot(
  watchId: string
): Promise<Snapshot | null> {
  const snaps = await getSnapshots(watchId);
  return snaps.length ? snaps[snaps.length - 1] : null;
}

async function pruneSnapshots(watchId: string): Promise<void> {
  const snaps = await getSnapshots(watchId);
  if (snaps.length <= MAX_SNAPSHOTS_PER_ITEM) return;
  const toDelete = snaps.slice(0, snaps.length - MAX_SNAPSHOTS_PER_ITEM);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_SNAPSHOTS, "readwrite");
    const store = transaction.objectStore(STORE_SNAPSHOTS);
    for (const s of toDelete) {
      if (s.id != null) store.delete(s.id);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ---------------------------------------------------------------------------
// Snapshot builders (from API payloads)
// ---------------------------------------------------------------------------

export function buildUserSnapshotData(a: UserAnalysis): UserSnapshotData {
  return {
    repoCount: a.totalRepos,
    totalStars: a.repos.reduce((s, r) => s + r.stargazers_count, 0),
    totalForks: a.repos.reduce((s, r) => s + r.forks_count, 0),
    totalBytes: a.totalBytes,
    followers: a.user.followers,
    following: a.user.following,
    topLanguages: a.overallLanguages
      .slice(0, 6)
      .map((l) => ({ name: l.name, value: l.value })),
    repoNames: a.repos.map((r) => r.name).sort(),
  };
}

export function buildRepoSnapshotData(d: RepoDeepAnalysis): RepoSnapshotData {
  return {
    stars: d.stars,
    forks: d.forks,
    watchers: d.watchers,
    openIssues: d.openIssues,
    openPRs: d.openPRs,
    sizeKb: d.sizeKb,
    pushedAt: d.pushedAt,
    recentCommits: d.recentCommits,
    topLanguages: d.languages
      .slice(0, 6)
      .map((l) => ({ name: l.name, value: l.value })),
    latestReleaseTag: d.releases[0]?.tag ?? null,
    latestReleaseAt: d.releases[0]?.publishedAt ?? null,
    releaseCount: d.releaseCount,
    contributorCount: d.contributorCount,
  };
}

// ---------------------------------------------------------------------------
// Diffing
// ---------------------------------------------------------------------------

export interface MetricDelta {
  key: string;
  before: number;
  after: number;
  delta: number;
}

export interface LanguageShift {
  name: string;
  before: number;
  after: number;
}

export interface WatchDiff {
  type: WatchType;
  hasChanges: boolean;
  sinceTimestamp: number;
  metrics: MetricDelta[];
  addedRepos: string[];
  removedRepos: string[];
  newReleaseTag: string | null;
  languageShifts: LanguageShift[];
}

function metric(key: string, before: number, after: number): MetricDelta {
  return { key, before, after, delta: after - before };
}

function languageShifts(
  before: { name: string; value: number }[],
  after: { name: string; value: number }[]
): LanguageShift[] {
  const beforeMap = new Map(before.map((l) => [l.name, l.value]));
  const afterMap = new Map(after.map((l) => [l.name, l.value]));
  const names = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const shifts: LanguageShift[] = [];
  for (const name of names) {
    const b = beforeMap.get(name) ?? 0;
    const a = afterMap.get(name) ?? 0;
    // Only surface meaningful shifts (≥0.5 percentage points).
    if (Math.abs(a - b) >= 0.5) shifts.push({ name, before: b, after: a });
  }
  return shifts.sort((x, y) => Math.abs(y.after - y.before) - Math.abs(x.after - x.before));
}

export function computeDiff(prev: Snapshot, curr: Snapshot): WatchDiff {
  if (prev.type === "user" && curr.type === "user") {
    const b = prev.data as UserSnapshotData;
    const a = curr.data as UserSnapshotData;
    const beforeRepos = new Set(b.repoNames);
    const afterRepos = new Set(a.repoNames);
    const addedRepos = a.repoNames.filter((n) => !beforeRepos.has(n));
    const removedRepos = b.repoNames.filter((n) => !afterRepos.has(n));
    const metrics = [
      metric("repoCount", b.repoCount, a.repoCount),
      metric("totalStars", b.totalStars, a.totalStars),
      metric("totalForks", b.totalForks, a.totalForks),
      metric("followers", b.followers, a.followers),
      metric("totalBytes", b.totalBytes, a.totalBytes),
    ].filter((m) => m.delta !== 0);
    const shifts = languageShifts(b.topLanguages, a.topLanguages);
    return {
      type: "user",
      sinceTimestamp: prev.timestamp,
      metrics,
      addedRepos,
      removedRepos,
      newReleaseTag: null,
      languageShifts: shifts,
      hasChanges:
        metrics.length > 0 ||
        addedRepos.length > 0 ||
        removedRepos.length > 0 ||
        shifts.length > 0,
    };
  }

  const b = prev.data as RepoSnapshotData;
  const a = curr.data as RepoSnapshotData;
  const metrics = [
    metric("stars", b.stars, a.stars),
    metric("forks", b.forks, a.forks),
    metric("watchers", b.watchers, a.watchers),
    metric("openIssues", b.openIssues, a.openIssues),
    metric("openPRs", b.openPRs, a.openPRs),
    metric("releaseCount", b.releaseCount, a.releaseCount),
    metric("contributorCount", b.contributorCount, a.contributorCount),
  ].filter((m) => m.delta !== 0);
  const shifts = languageShifts(b.topLanguages, a.topLanguages);
  const newReleaseTag =
    a.latestReleaseTag && a.latestReleaseTag !== b.latestReleaseTag
      ? a.latestReleaseTag
      : null;
  const pushed = a.pushedAt !== b.pushedAt;
  return {
    type: "repo",
    sinceTimestamp: prev.timestamp,
    metrics,
    addedRepos: [],
    removedRepos: [],
    newReleaseTag,
    languageShifts: shifts,
    hasChanges:
      metrics.length > 0 || shifts.length > 0 || !!newReleaseTag || pushed,
  };
}
