/**
 * Server-side in-memory cache with stale-while-revalidate pattern.
 * Provides smart caching for GitHub API responses to reduce rate limit usage.
 */

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  staleAt: number;   // After this, serve stale + revalidate in background
  expiresAt: number; // After this, data is considered expired
}

class SmartCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private revalidating = new Set<string>();
  private maxEntries: number;

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached data. Returns { data, status } where status is:
   * - "fresh": data is within TTL
   * - "stale": data is stale but returned, background revalidation triggered
   * - "miss": no cached data
   */
  get<T>(key: string): { data: T | null; status: "fresh" | "stale" | "miss" } {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return { data: null, status: "miss" };

    const now = Date.now();

    if (now < entry.staleAt) {
      return { data: entry.data, status: "fresh" };
    }

    if (now < entry.expiresAt) {
      return { data: entry.data, status: "stale" };
    }

    // Expired — remove
    this.store.delete(key);
    return { data: null, status: "miss" };
  }

  /**
   * Store data in cache.
   * @param ttlMs Time in ms before data becomes "stale" (default: 15 min)
   * @param maxAge Time in ms before data fully expires (default: 60 min)
   */
  set<T>(key: string, data: T, ttlMs = 15 * 60 * 1000, maxAge = 60 * 60 * 1000): void {
    // Evict oldest if over limit
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      createdAt: now,
      staleAt: now + ttlMs,
      expiresAt: now + maxAge,
    });
  }

  /**
   * Check if a key is currently being revalidated
   */
  isRevalidating(key: string): boolean {
    return this.revalidating.has(key);
  }

  /**
   * Mark a key as being revalidated (to prevent duplicate background fetches)
   */
  markRevalidating(key: string): void {
    this.revalidating.add(key);
  }

  /**
   * Unmark a key as being revalidated
   */
  unmarkRevalidating(key: string): void {
    this.revalidating.delete(key);
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get cache stats
   */
  stats(): { entries: number; revalidating: number } {
    return {
      entries: this.store.size,
      revalidating: this.revalidating.size,
    };
  }

  /**
   * Purge expired entries
   */
  purge(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// Singleton cache instance
export const serverCache = new SmartCache(200);

/**
 * Helper: cache key builders
 */
export function userCacheKey(username: string): string {
  return `user:${username.toLowerCase()}`;
}

export function healthCacheKey(username: string): string {
  return `health:${username.toLowerCase()}`;
}

export function personaCacheKey(username: string): string {
  return `persona:${username.toLowerCase()}`;
}

export function contributionsCacheKey(username: string): string {
  return `contributions:${username.toLowerCase()}`;
}

export function extensionsCacheKey(username: string, extensions: string): string {
  return `extensions:${username.toLowerCase()}:${extensions}`;
}
