export interface RepoActivityLike {
  created_at?: string | null;
  updated_at?: string | null;
  pushed_at?: string | null;
  advancedMetrics?: {
    lastMaintenance?: string | null;
  };
}

function isValidDate(value: string | null | undefined): value is string {
  return !!value && Number.isFinite(Date.parse(value));
}

/**
 * Prefer the latest commit observed on the default branch, then GitHub's
 * last-push timestamp. `updated_at` is deliberately only a final fallback:
 * GitHub may change it for repository metadata activity unrelated to code.
 */
export function getRepoActivityDate(repo: RepoActivityLike): string {
  const candidates = [
    repo.advancedMetrics?.lastMaintenance,
    repo.pushed_at,
    repo.created_at,
    repo.updated_at,
  ];
  return candidates.find(isValidDate) ?? "";
}

export function getRepoActivityTimestamp(repo: RepoActivityLike): number {
  const activityDate = getRepoActivityDate(repo);
  return activityDate ? Date.parse(activityDate) : 0;
}

export function getDevelopmentSpanDays(repo: RepoActivityLike): number {
  if (!isValidDate(repo.created_at)) return 0;
  const activityTimestamp = getRepoActivityTimestamp(repo);
  if (!activityTimestamp) return 0;
  return Math.max(
    0,
    Math.round((activityTimestamp - Date.parse(repo.created_at)) / 86_400_000)
  );
}
