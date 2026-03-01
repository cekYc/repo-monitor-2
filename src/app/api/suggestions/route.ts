import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const languages = searchParams.get("languages"); // comma-separated
  const token = searchParams.get("token");

  if (!languages) {
    return NextResponse.json(
      { error: "languages parametresi gerekli" },
      { status: 400 }
    );
  }

  const langList = languages.split(",").slice(0, 3); // top 3 languages
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    const suggestions = [];

    for (const lang of langList) {
      const { data } = await octokit.search.repos({
        q: `language:${lang.trim()} stars:>1000`,
        sort: "stars",
        order: "desc",
        per_page: 3,
      });

      for (const repo of data.items) {
        suggestions.push({
          name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          language: repo.language,
          forks_count: repo.forks_count,
        });
      }
    }

    // Deduplicate by name
    const seen = new Set<string>();
    const unique = suggestions.filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });

    return NextResponse.json({ suggestions: unique.slice(0, 9) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
