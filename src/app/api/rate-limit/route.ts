import { NextRequest } from "next/server";
import { Octokit } from "@octokit/rest";
import { resolveToken } from "@/lib/request-token";

export async function GET(request: NextRequest) {
  const { token } = await resolveToken(request);
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    const { data } = await octokit.rateLimit.get();
    const core = data.resources.core;

    return Response.json(
      {
        limit: core.limit,
        remaining: core.remaining,
        reset: core.reset, // unix seconds
        used: core.used,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ code: "unknown", error: "rate limit unavailable" }, { status: 500 });
  }
}
