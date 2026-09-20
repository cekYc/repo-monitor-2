import { NextRequest, NextResponse } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";
import { serverCache, userCacheKey } from "@/lib/cache";
import { classifyGithubError } from "@/lib/api-error";
import { resolveToken } from "@/lib/request-token";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";

  if (!username) {
    return NextResponse.json(
      { code: "bad_request", error: "username parameter is required" },
      { status: 400 }
    );
  }

  const { token, session, source } = await resolveToken(request);

  // Owner analyses can contain private repository data. Sharing that under a
  // generic "authenticated" key could leak it into another visitor's request,
  // so only a session token — whose identity we know — is allowed to key the
  // shared cache at all.
  const isOwnProfile = session?.login.toLowerCase() === username.toLowerCase();
  const cacheable = source === "session" || source === "none";
  const cacheKey = isOwnProfile
    ? `${userCacheKey(username)}-owner-${session?.login.toLowerCase() ?? username.toLowerCase()}`
    : `${userCacheKey(username)}-public`;

  if (cacheable && !forceRefresh) {
    const cached = serverCache.get(cacheKey);
    if (cached.status === "fresh") {
      return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
    }
    if (cached.status === "stale") {
      if (!serverCache.isRevalidating(cacheKey)) {
        serverCache.markRevalidating(cacheKey);
        fetchUserAnalysis(username, token)
          .then((data) => serverCache.set(cacheKey, data))
          .catch(() => {})
          .finally(() => serverCache.unmarkRevalidating(cacheKey));
      }
      return NextResponse.json(cached.data, { headers: { "X-Cache": "STALE" } });
    }
  }

  try {
    const analysis = await fetchUserAnalysis(username, token);
    if (cacheable) serverCache.set(cacheKey, analysis);
    return NextResponse.json(analysis, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const { code, status } = classifyGithubError(error);
    return NextResponse.json(
      { code, error: error instanceof Error ? error.message : "unknown" },
      { status }
    );
  }
}
