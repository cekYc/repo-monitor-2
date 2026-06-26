import { NextRequest, NextResponse } from "next/server";
import { fetchRepoDeepAnalysis } from "@/lib/github";
import { serverCache, repoDeepCacheKey } from "@/lib/cache";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo parameters are required" },
      { status: 400 }
    );
  }

  // Prefer an explicit ?token= (manual PAT flow), else fall back to the
  // OAuth session cookie.
  const session = await getSession();
  const token = searchParams.get("token") || session?.githubToken;

  const cacheKey = repoDeepCacheKey(owner, repo) + (token ? "-auth" : "");

  if (!forceRefresh) {
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
    serverCache.set(cacheKey, analysis);
    return NextResponse.json(analysis, { headers: { "X-Cache": "MISS" } });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("Not Found")) {
      return NextResponse.json(
        { error: `"${owner}/${repo}" not found` },
        { status: 404 }
      );
    }
    if (message.includes("Bad credentials")) {
      return NextResponse.json(
        { error: "Invalid GitHub token. Please sign in again." },
        { status: 401 }
      );
    }
    if (message.includes("rate limit") || message.includes("API rate limit")) {
      return NextResponse.json(
        {
          error: session
            ? "API rate limit exceeded."
            : "API rate limit exceeded. Sign in with GitHub to raise the limit.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
