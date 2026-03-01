import { NextRequest } from "next/server";
import { Octokit } from "@octokit/rest";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    const { data } = await octokit.rateLimit.get();
    const core = data.resources.core;

    return Response.json({
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset, // Unix timestamp
      used: core.used,
    });
  } catch {
    return Response.json(
      { error: "Rate limit bilgisi alınamadı" },
      { status: 500 }
    );
  }
}
