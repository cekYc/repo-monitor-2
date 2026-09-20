/** API quota display rules, in one place.
 *
 *  Deliberately there is no "green" level: a healthy quota is neutral, not a
 *  reward. That makes the old failure mode — a green badge sitting on an
 *  exhausted quota — impossible to express. */

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // unix seconds
  used: number;
}

export type QuotaLevel = "neutral" | "low" | "critical";

export function quotaLevel(info: RateLimitInfo): QuotaLevel {
  if (info.limit <= 0) return "neutral";
  if (info.remaining <= 0) return "critical";
  const pct = (info.remaining / info.limit) * 100;
  if (pct < 20) return "critical";
  if (pct < 50) return "low";
  return "neutral";
}

/** Anonymous callers get 60 requests an hour; a signed-in session gets 5,000.
 *
 *  A 60-request ceiling is an alarm state even while it still reads 60/60 —
 *  it is one analysis away from empty — so the badge shows it in red with the
 *  sign-in / token action rather than waiting for the quota to actually run
 *  out. */
export function isLowCeiling(info: RateLimitInfo): boolean {
  return info.limit > 0 && info.limit <= 60;
}

/** Whether the badge should read as an alarm: exhausted, nearly exhausted, or
 *  stuck on the anonymous ceiling. */
export function isAlarming(info: RateLimitInfo): boolean {
  return quotaLevel(info) === "critical" || isLowCeiling(info);
}

export function quotaToneClass(level: QuotaLevel): string {
  if (level === "critical") return "text-danger";
  if (level === "low") return "text-warning";
  return "text-muted";
}

export function quotaDotClass(level: QuotaLevel): string {
  if (level === "critical") return "bg-danger";
  if (level === "low") return "bg-warning";
  return "bg-faint";
}

export function quotaBarClass(level: QuotaLevel): string {
  if (level === "critical") return "bg-danger";
  if (level === "low") return "bg-warning";
  return "bg-accent";
}

export function formatCountdown(resetUnix: number, now: number): string {
  const secs = Math.max(0, Math.floor((resetUnix * 1000 - now) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
