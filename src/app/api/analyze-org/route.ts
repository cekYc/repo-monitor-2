import { NextRequest, NextResponse } from "next/server";
import { fetchOrgAnalysis } from "@/lib/github";
import { classifyGithubError } from "@/lib/api-error";
import { resolveToken } from "@/lib/request-token";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const org = request.nextUrl.searchParams.get("org");

  if (!org) {
    return NextResponse.json(
      { code: "bad_request", error: "org parameter is required" },
      { status: 400 }
    );
  }

  const { token } = await resolveToken(request);

  try {
    const analysis = await fetchOrgAnalysis(org, token);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    const { code, status } = classifyGithubError(error);
    return NextResponse.json(
      { code, error: error instanceof Error ? error.message : "unknown" },
      { status }
    );
  }
}
