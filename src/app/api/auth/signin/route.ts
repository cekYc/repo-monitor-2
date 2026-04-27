import { NextResponse } from "next/server";

// GET /api/auth/signin
// Kullanıcıyı GitHub OAuth sayfasına yönlendirir
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GITHUB_CLIENT_ID tanımlı değil" },
      { status: 500 }
    );
  }

  // CSRF saldırılarına karşı rastgele state üret
  const state = crypto.randomUUID();

  // İsteyebileceğimiz izinler:
  // - read:user  → kullanıcı profili (gerekli)
  // - repo       → özel repo erişimi (isteğe bağlı, sadece public repo'lar için gerekmez)
  const scope = "read:user repo";

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", `${process.env.NEXTAUTH_URL}/api/auth/callback`);
  githubAuthUrl.searchParams.set("scope", scope);
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());

  // State'i geçici cookie'ye kaydet (callback'te doğrulama için)
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 dakika
    path: "/",
  });

  return response;
}