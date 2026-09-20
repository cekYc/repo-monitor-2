/** Cross-component UI signals. Kept as DOM events so deep children (an error
 *  banner, an empty state) can reach the header without threading context. */

/** Opens the header session popover — the one place quota + token + auth live. */
export const OPEN_SESSION_EVENT = "rm:open-session";

/** Focuses the single global search field in the header. */
export const FOCUS_SEARCH_EVENT = "rm:focus-search";

/** Tells the header to re-read the API quota. Fired whenever a request comes
 *  back rate-limited, so the badge can never sit on a stale "60/60" while the
 *  screen behind it says the quota is spent. */
export const QUOTA_STALE_EVENT = "rm:quota-stale";
