import { notifyStoredChange } from "@/lib/use-stored";

/** Optional personal access token, stored only in this browser.
 *
 *  It travels in the `X-GitHub-Token` request header, never in a query string,
 *  so it cannot end up in URL history, server logs or proxy traces. When an
 *  OAuth session exists the server prefers the session token and ignores this
 *  one. */

export const TOKEN_KEY = "repo-monitor-gh-token";

export const TOKEN_HEADER = "X-GitHub-Token";

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredToken(value: string) {
  try {
    const trimmed = value.trim();
    if (trimmed) localStorage.setItem(TOKEN_KEY, trimmed);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private mode / blocked storage: the app still works, just unauthenticated
  }
  notifyStoredChange();
}

/** Header bag for fetch(). Empty when no token is stored. */
export function tokenHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { [TOKEN_HEADER]: token } : {};
}
