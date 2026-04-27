import { NextRequest, NextResponse } from "next/server";
import { fetchRepoCommitHistory } from "@/lib/github";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const session = await getSession();
  const token = session?.githubToken;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner ve repo parametreleri gerekli" },
      { status: 400 }
    );
  }

  try {
    const history = await fetchRepoCommitHistory(
      owner,
      repo,
      token || undefined,
      15
    );
    return NextResponse.json(history);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";

    if (message.includes("rate limit") || message.includes("API rate limit")) {
      return NextResponse.json(
        { error: "API istek limiti aşıldı. Token kullanarak limiti artırabilirsiniz." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
