/** The single search field accepts a user, an org, an `owner/repo`, or a
 *  pasted github.com URL. Everything is normalized here so the header, the
 *  empty states and the deep links all agree on what an input means. */

export type Target =
  | { kind: "user"; login: string }
  | { kind: "repo"; owner: string; repo: string };

const GITHUB_RESERVED = new Set([
  "orgs",
  "topics",
  "collections",
  "sponsors",
  "settings",
  "search",
  "explore",
  "notifications",
  "marketplace",
  "pulls",
  "issues",
  "codespaces",
]);

export function parseTarget(raw: string): Target | null {
  let value = raw.trim();
  if (!value) return null;

  // Pasted URL in any shape: https://github.com/x, github.com/x/y#readme
  value = value
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^(www\.)?github\.com\//i, "")
    .replace(/[#?].*$/, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^@/, "");

  if (!value) return null;

  const parts = value.split("/").filter(Boolean);
  const first = parts[0];
  if (!first || GITHUB_RESERVED.has(first.toLowerCase())) return null;
  if (!isValidName(first)) return null;

  if (parts.length === 1) return { kind: "user", login: first };

  // owner/repo plus anything after it (tree/main, blob/..., /issues)
  const repo = parts[1];
  if (!isValidName(repo)) return { kind: "user", login: first };
  return { kind: "repo", owner: first, repo };
}

function isValidName(name: string): boolean {
  return /^[A-Za-z0-9._-]{1,100}$/.test(name);
}

/** Route a parsed target to its page. Users land on Analyze, repos on detail. */
export function targetHref(target: Target): string {
  return target.kind === "repo"
    ? `/repo/${target.owner}/${target.repo}`
    : `/?user=${encodeURIComponent(target.login)}`;
}

export function targetLabel(target: Target): string {
  return target.kind === "repo"
    ? `${target.owner}/${target.repo}`
    : target.login;
}
