import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// POST /api/auth/signout
export async function POST(request: NextRequest) {
  await clearSessionCookie();
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/`);
}