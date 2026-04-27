import { NextRequest, NextResponse } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";
import { serverCache, userCacheKey } from "@/lib/cache";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!username) {
    return NextResponse.json(
      { error: "username parametresi gerekli" },
      { status: 400 }
    );
  }

  // Token artık cookie'deki JWT'den okunuyor — query param'dan değil!
  // Bu sayede token asla URL geçmişine, log'lara veya proxy'lere düşmez.
  const session = await getSession();
  const token = session?.githubToken;

  // Token varsa cache key'in sonuna "-auth" ekleyerek public ve private cache'leri ayır
const cacheKey = userCacheKey(username) + (token ? "-auth" : "");

  // Sunucu önbelleği kontrolü
  if (!forceRefresh) {
    const cached = serverCache.get(cacheKey);
    if (cached.status === "fresh") {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": "HIT" },
      });
    }
    if (cached.status === "stale") {
      if (!serverCache.isRevalidating(cacheKey)) {
        serverCache.markRevalidating(cacheKey);
        fetchUserAnalysis(username, token)
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
    const analysis = await fetchUserAnalysis(username, token);
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
        { error: "Geçersiz GitHub token. Lütfen tekrar giriş yapın." },
        { status: 401 }
      );
    }
    if (message.includes("rate limit") || message.includes("API rate limit")) {
      return NextResponse.json(
        {
          error: session
            ? "API istek limiti aşıldı."
            : "API istek limiti aşıldı. GitHub ile giriş yaparak limiti artırabilirsiniz.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}