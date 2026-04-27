import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET /api/auth/session
// Client component'lerin mevcut session'ı sorgulaması için
// ÖNEMLI: githubToken hiçbir zaman client'a gönderilmez
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      login: session.login,
      avatarUrl: session.avatarUrl,
    },
  });
}