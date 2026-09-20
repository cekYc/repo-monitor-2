import { NextRequest, NextResponse } from "next/server";
import { fetchRepoCommitHistory } from "@/lib/github";
import { classifyGithubError } from "@/lib/api-error";
import { resolveToken } from "@/lib/request-token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { code: "bad_request", error: "owner and repo parameters are required" },
      { status: 400 }
    );
  }

  const { token } = await resolveToken(request);

  try {
    const history = await fetchRepoCommitHistory(owner, repo, token, 30);
    return NextResponse.json(history);
  } catch (error: unknown) {
    const { code, status } = classifyGithubError(error);
    return NextResponse.json(
      { code, error: error instanceof Error ? error.message : "unknown" },
      { status }
    );
  }
}
