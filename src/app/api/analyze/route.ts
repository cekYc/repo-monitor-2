import { NextRequest, NextResponse } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";
import { serverCache, userCacheKey } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!username) {
    return NextResponse.json(
      { error: "username parametresi gerekli" },
      { status: 400 }
    );
  }

  const cacheKey = userCacheKey(username);

  // Check server cache (unless force refresh)
  if (!forceRefresh) {
    const cached = serverCache.get(cacheKey);
    if (cached.status === "fresh") {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT" },
      });
    }
    if (cached.status === "stale") {
      // Return stale data immediately, revalidate in background
      if (!serverCache.isRevalidating(cacheKey)) {
        serverCache.markRevalidating(cacheKey);
        fetchUserAnalysis(username, token || undefined)
          .then((data) => serverCache.set(cacheKey, data))
          .catch(() => {})
          .finally(() => serverCache.unmarkRevalidating(cacheKey));
      }
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "STALE" },
      });
    }
  }

  try {
    const analysis = await fetchUserAnalysis(username, token || undefined);
    serverCache.set(cacheKey, analysis);
    return NextResponse.json(analysis, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";

    if (message.includes("Not Found")) {
      return NextResponse.json(
        { error: `"${username}" kullanıcısı bulunamadı` },
        { status: 404 }
      );
    }

    if (message.includes("Bad credentials")) {
      return NextResponse.json(
        { error: "Geçersiz GitHub API token" },
        { status: 401 }
      );
    }

    if (message.includes("rate limit") || message.includes("API rate limit")) {
      return NextResponse.json(
        { error: "API istek limiti aşıldı. Token kullanarak limiti artırabilirsiniz." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
