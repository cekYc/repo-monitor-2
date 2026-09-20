/** Recently analyzed targets. Shared by the header search suggestions and the
 *  Analyze screen so there is exactly one history list in the product. */

const RECENT_KEY = "repo-monitor-recent-searches";
const LAST_USER_KEY = "repo-monitor-last-user";
const MAX_RECENT = 8;

export interface RecentSearch {
  username: string;
  avatarUrl?: string;
  timestamp: number;
}

export function getRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentSearch[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(username: string, avatarUrl?: string) {
  try {
    const next = getRecentSearches().filter(
      (s) => s.username.toLowerCase() !== username.toLowerCase()
    );
    next.unshift({ username, avatarUrl, timestamp: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, MAX_RECENT)));
    localStorage.setItem(LAST_USER_KEY, username);
  } catch {
    // storage unavailable — history is a convenience, not state we depend on
  }
}

/** Drives the "no empty first screen" rule: reopening the app restores the
 *  last profile the visitor actually looked at. */
export function getLastUser(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}
