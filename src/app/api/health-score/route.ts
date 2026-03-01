import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { serverCache, healthCacheKey } from "@/lib/cache";

export const runtime = "nodejs";

interface RepoHealth {
  name: string;
  score: number;
  checks: {
    hasReadme: boolean;
    hasLicense: boolean;
    hasDescription: boolean;
    hasCI: boolean;
    recentUpdate: boolean;
    lowIssueRatio: boolean;
  };
}

interface HealthResult {
  username: string;
  overallScore: number;
  grade: "excellent" | "good" | "fair" | "poor";
  repos: RepoHealth[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  // Check cache
  const cacheKey = healthCacheKey(username);
  const cached = serverCache.get<HealthResult>(cacheKey);
  if (cached.status === "fresh" || cached.status === "stale") {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": cached.status === "fresh" ? "HIT" : "STALE" },
    });
  }

  try {
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();

    // Fetch all repos
    let page = 1;
    const allRepos: Awaited<ReturnType<typeof octokit.repos.listForUser>>["data"] = [];
    while (true) {
      const { data: repos } = await octokit.repos.listForUser({
        username,
        type: "owner",
        per_page: 100,
        page,
        sort: "updated",
      });
      allRepos.push(...repos);
      if (repos.length < 100) break;
      page++;
    }

    const ownRepos = allRepos.filter((r) => !r.fork);
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // Analyze each repo in batches
    const BATCH_SIZE = 10;
    const repoHealths: RepoHealth[] = [];

    for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
      const batch = ownRepos.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (repo) => {
          const checks = {
            hasReadme: false,
            hasLicense: !!repo.license,
            hasDescription: !!repo.description && repo.description.length > 0,
            hasCI: false,
            recentUpdate: new Date(repo.updated_at || "").getTime() > ninetyDaysAgo,
            lowIssueRatio: true,
          };

          // Check README existence
          try {
            await octokit.repos.getReadme({ owner: username, repo: repo.name });
            checks.hasReadme = true;
          } catch {
            checks.hasReadme = false;
          }

          // Check CI/CD (.github/workflows)
          try {
            const { data: tree } = await octokit.git.getTree({
              owner: username,
              repo: repo.name,
              tree_sha: repo.default_branch || "main",
              recursive: "1",
            });
            checks.hasCI = tree.tree.some(
              (item) =>
                item.path?.startsWith(".github/workflows/") &&
                (item.path.endsWith(".yml") || item.path.endsWith(".yaml"))
            );
          } catch {
            checks.hasCI = false;
          }

          // Check open issues ratio
          if ((repo.open_issues_count ?? 0) > 0 && repo.stargazers_count !== undefined) {
            const ratio = (repo.open_issues_count ?? 0) / Math.max(repo.stargazers_count ?? 1, 1);
            checks.lowIssueRatio = ratio < 2;
          }

          // Calculate score (each check is worth points)
          let score = 0;
          if (checks.hasReadme) score += 25;
          if (checks.hasLicense) score += 20;
          if (checks.hasDescription) score += 15;
          if (checks.hasCI) score += 20;
          if (checks.recentUpdate) score += 10;
          if (checks.lowIssueRatio) score += 10;

          return { name: repo.name, score, checks };
        })
      );
      repoHealths.push(...results);
    }

    // Calculate overall score
    const overallScore =
      repoHealths.length > 0
        ? Math.round(repoHealths.reduce((sum, r) => sum + r.score, 0) / repoHealths.length)
        : 0;

    const grade: HealthResult["grade"] =
      overallScore >= 80 ? "excellent" : overallScore >= 60 ? "good" : overallScore >= 40 ? "fair" : "poor";

    const result: HealthResult = {
      username,
      overallScore,
      grade,
      repos: repoHealths.sort((a, b) => b.score - a.score),
    };

    // Cache for 30 min / 2 hr max
    serverCache.set(cacheKey, result, 30 * 60 * 1000, 2 * 60 * 60 * 1000);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Not Found")) {
      return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
    }
    if (message.includes("rate limit")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
