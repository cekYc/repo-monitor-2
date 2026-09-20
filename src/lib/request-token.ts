import type { NextRequest } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

export interface ResolvedToken {
  token?: string;
  session: SessionPayload | null;
  /** Where the token came from. Only `session` tokens are safe to key the
   *  shared server cache on: a browser-supplied token belongs to one visitor
   *  and its results (which may include private repositories) must not be
   *  stored under a key another visitor can hit. */
  source: "session" | "header" | "query" | "none";
}

/** Resolves the GitHub token for a request.
 *
 *  Priority: OAuth session cookie, then the `X-GitHub-Token` header, then a
 *  legacy `?token=` query parameter. The header is preferred over the query
 *  string so a personal access token never lands in URL history or logs. */
export async function resolveToken(request: NextRequest): Promise<ResolvedToken> {
  const session = await getSession();
  if (session?.githubToken) {
    return { token: session.githubToken, session, source: "session" };
  }

  const header = request.headers.get("x-github-token")?.trim();
  if (header) return { token: header, session, source: "header" };

  const query = request.nextUrl.searchParams.get("token")?.trim();
  if (query) return { token: query, session, source: "query" };

  return { token: undefined, session, source: "none" };
}
