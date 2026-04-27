import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

// GET /api/auth/callback
// GitHub'dan dönen code'u access token'a çevirir, JWT oluşturur, cookie'ye yazar
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;

  // Kullanıcı erişimi reddettiyse
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=missing_code`);
  }

  // CSRF: state doğrulaması
  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=state_mismatch`);
  }

  try {
    // 1. Code → Access Token değişimi
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub token exchange error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
    }

    const accessToken: string = tokenData.access_token;

    // 2. Kullanıcı bilgilerini çek
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=user_fetch_failed`);
    }

    const githubUser = await userResponse.json();

    // 3. JWT oluştur (GitHub access token + kullanıcı bilgileri)
    const sessionToken = await createSessionToken({
      login: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      githubToken: accessToken,   // ← API çağrılarında kullanılacak
    });

    // 4. Session cookie'ye yaz
    await setSessionCookie(sessionToken);

    // 5. oauth_state cookie'sini temizle
    const redirectResponse = NextResponse.redirect(`${baseUrl}/`);
    redirectResponse.cookies.delete("oauth_state");

    return redirectResponse;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?auth_error=unexpected`);
  }
}