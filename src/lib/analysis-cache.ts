import type { UserAnalysis } from "@/lib/github";

/** Browser-side analysis cache.
 *
 *  Two readers with different needs:
 *   - `readFresh` powers the instant-open path (< 30 min old).
 *   - `readAny` powers the quota-exhausted fallback: showing yesterday's
 *     numbers with a banner beats showing an empty screen.
 *
 *  Owner-scope analyses can contain private repository data and are never
 *  written here. */

const CACHE_PREFIX = "repo-monitor-cache-v3-";
const FRESH_MS = 30 * 60 * 1000;
const EXTENSIONS_KEY = "repo-monitor-custom-extensions";

interface CacheEntry {
  timestamp: number;
  data: UserAnalysis;
}

export interface CachedAnalysis {
  data: UserAnalysis;
  timestamp: number;
  stale: boolean;
}

export function getCustomExtensionsRaw(): string | null {
  try {
    return localStorage.getItem(EXTENSIONS_KEY);
  } catch {
    return null;
  }
}

function cacheKey(username: string): string {
  const base = CACHE_PREFIX + username.toLowerCase();
  const raw = getCustomExtensionsRaw();
  if (!raw) return base;
  try {
    // Custom extension mappings change the numbers, so they change the key.
    return `${base}-${btoa(raw).substring(0, 20)}`;
  } catch {
    return base;
  }
}

function read(username: string): CachedAnalysis | null {
  try {
    const raw = localStorage.getItem(cacheKey(username));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.data?.user) return null;
    if (entry.data.analysisScope !== "public") {
      localStorage.removeItem(cacheKey(username));
      return null;
    }
    return {
      data: entry.data,
      timestamp: entry.timestamp,
      stale: Date.now() - entry.timestamp > FRESH_MS,
    };
  } catch {
    return null;
  }
}

export function readFresh(username: string): CachedAnalysis | null {
  const hit = read(username);
  return hit && !hit.stale ? hit : null;
}

export function readAny(username: string): CachedAnalysis | null {
  return read(username);
}

export function writeAnalysis(username: string, data: UserAnalysis) {
  if (data.analysisScope !== "public") return;
  try {
    const entry: CacheEntry = { timestamp: Date.now(), data };
    localStorage.setItem(cacheKey(username), JSON.stringify(entry));
  } catch {
    // quota full or blocked storage — the cache is an optimization only
  }
}

export function clearAnalysis(username: string) {
  try {
    localStorage.removeItem(cacheKey(username));
  } catch {}
}
