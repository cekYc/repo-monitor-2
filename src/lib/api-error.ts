import type { ErrorCode } from "@/lib/errors";

/** Maps a GitHub/Octokit failure to a machine-readable code plus an HTTP
 *  status. Routes return the code and the client renders the localized copy,
 *  so no server-side sentence ever reaches the screen in the wrong language. */
export function classifyGithubError(error: unknown): {
  code: ErrorCode;
  status: number;
} {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message.includes("Not Found")) return { code: "not_found", status: 404 };
  if (message.includes("Bad credentials")) return { code: "bad_credentials", status: 401 };
  if (message.includes("rate limit") || message.includes("API rate limit")) {
    return { code: "rate_limit", status: 429 };
  }
  return { code: "unknown", status: 500 };
}
