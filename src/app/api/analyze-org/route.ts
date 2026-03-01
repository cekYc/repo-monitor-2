import { NextRequest, NextResponse } from "next/server";
import { fetchOrgAnalysis } from "@/lib/github";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const org = searchParams.get("org");
  const token = searchParams.get("token");

  if (!org) {
    return NextResponse.json(
      { error: "org parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    const analysis = await fetchOrgAnalysis(org, token || undefined);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";

    if (message.includes("Not Found")) {
      return NextResponse.json(
        { error: `"${org}" organizasyonu bulunamadı` },
        { status: 404 }
      );
    }
    if (message.includes("Bad credentials")) {
      return NextResponse.json(
        { error: "Geçersiz GitHub API token" },
        { status: 401 }
      );
    }
    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "API istek limiti aşıldı" },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
