import { NextRequest, NextResponse } from "next/server";
import { fetchUserAnalysis } from "@/lib/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return NextResponse.json(
      { error: "username parametresi gerekli" },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "GitHub API token gerekli" },
      { status: 400 }
    );
  }

  try {
    const analysis = await fetchUserAnalysis(username, token);
    return NextResponse.json(analysis);
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

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
