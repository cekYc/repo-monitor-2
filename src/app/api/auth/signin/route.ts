import { NextRequest, NextResponse } from "next/server";

// NEXT.JS'İN BU ROTAYI CACHE'LEMESİNİ KESİNLİKLE ENGELLER
export const dynamic = "force-dynamic"; 

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GITHUB_CLIENT_ID tanımlı değil" },
      { status: 500 }
    );
  }

  // Artık her tıklamada gerçekten yeni ve rastgele bir state üretilecek
  const state = crypto.randomUUID();

  // İstediğimiz kapsamlar (özel repoları görmek için 'repo' şart)
  const scope = "read:user repo";

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXTAUTH_URL}/api/auth/callback`);
  githubAuthUrl.searchParams.set("scope", scope);
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}