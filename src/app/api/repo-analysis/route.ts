import { NextRequest, NextResponse } from "next/server";
import { fetchRepoDeepAnalysis } from "@/lib/github";
import { serverCache, repoDeepCacheKey } from "@/lib/cache";
import { classifyGithubError } from "@/lib/api-error";
import { resolveToken } from "@/lib/request-token";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!owner || !repo) {
    return NextResponse.json(
      { code: "bad_request", error: "owner and repo parameters are required" },
      { status: 400 }
    );
  }

  const { token, source } = await resolveToken(request);

  // A browser-supplied token can reach private repositories, and the server
  // cache is shared across visitors — so only anonymous and session-scoped
  // reads are cached.
  const cacheable = source === "none" || source === "session";
  const cacheKey = repoDeepCacheKey(owner, repo) + (source === "session" ? "-auth" : "");

  if (cacheable && !forceRefresh) {
    const cached = serverCache.get(cacheKey);
    if (cached.status === "fresh") {
      return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
    }
    if (cached.status === "stale") {
      if (!serverCache.isRevalidating(cacheKey)) {
        serverCache.markRevalidating(cacheKey);
        fetchRepoDeepAnalysis(owner, repo, token)
          .then((data) => serverCache.set(cacheKey, data))
          .catch(() => {})
          .finally(() => serverCache.unmarkRevalidating(cacheKey));
      }
      return NextResponse.json(cached.data, { headers: { "X-Cache": "STALE" } });
    }
  }

  try {
    const analysis = await fetchRepoDeepAnalysis(owner, repo, token);
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
