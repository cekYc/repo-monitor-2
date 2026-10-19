import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { resolveToken } from "@/lib/request-token";
import { buildSampleContributedRepos } from "@/lib/sample-analysis";
import type { RepoInfo, RepoLanguages } from "@/lib/github";

export const runtime = "nodejs";

const CONTRIBUTED_REPOS_GRAPHQL = `
  query($username: String!) {
    user(login: $username) {
      repositoriesContributedTo(
        first: 100,
        contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY],
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          name
          nameWithOwner
          description
          url
          isPrivate
          isFork
          stargazerCount
          forkCount
          diskUsage
          createdAt
          updatedAt
          pushedAt
          owner {
            login
            avatarUrl
          }
          languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
            totalSize
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
    }
  }
`;

interface GraphQLEdge {
  size: number;
  node: {
    name: string;
  };
}

interface GraphQLRepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  diskUsage?: number;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  languages?: {
    totalSize: number;
    edges: GraphQLEdge[];
  };
}

function computeContributionStats(
  totalBytes: number,
  userCommits = 1,
  userLines?: number
): { contributedBytes: number; contributedLines: number; commits: number; ratio: number } {
  const safeTotal = Math.max(totalBytes, 1024);
  const lines = userLines ?? Math.max(15, userCommits * 140);
  const estimatedBytes = Math.round(lines * 45);
  const contributedBytes = Math.min(
    Math.max(1024, estimatedBytes),
    Math.round(safeTotal * 0.9)
  );
  const ratio = Math.min(1, Math.round((contributedBytes / safeTotal) * 10000) / 10000);

  return {
    contributedBytes,
    contributedLines: lines,
    commits: userCommits,
    ratio,
  };
}

function transformGraphQLNode(node: GraphQLRepoNode): RepoInfo {
  const languages: RepoLanguages = {};
  let totalBytes = 0;

  if (node.languages?.edges) {
    for (const edge of node.languages.edges) {
      languages[edge.node.name] = edge.size;
      totalBytes += edge.size;
    }
  }

  const languagePercentages = Object.entries(languages).map(([name, bytes]) => ({
    name,
    bytes,
    value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
  }));

  const userContribution = computeContributionStats(totalBytes, 2);

  return {
    name: node.name,
    fullName: node.nameWithOwner,
    ownerLogin: node.owner.login,
    ownerAvatar: node.owner.avatarUrl,
    description: node.description,
    html_url: node.url,
    stargazers_count: node.stargazerCount,
    forks_count: node.forkCount,
    size: node.diskUsage || 0,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    pushed_at: node.pushedAt,
    languages,
    languagePercentages,
    totalBytes,
    private: node.isPrivate,
    isContributed: true,
    userContribution,
  };
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json(
      { error: "username parameter is required" },
      { status: 400 }
    );
  }

  // Sample data path for placeholder visits
  if (username.toLowerCase() === "sample" || username.toLowerCase() === "octo-sample") {
    const repos = buildSampleContributedRepos();
    return NextResponse.json({ username, repos, totalCount: repos.length });
  }

  const { token, session } = await resolveToken(request);
  const normalizedUser = username.toLowerCase();

  // 1. Try GraphQL if token is available
  if (token) {
    try {
      const gqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "RepoMonitor",
        },
        body: JSON.stringify({
          query: CONTRIBUTED_REPOS_GRAPHQL,
          variables: { username },
        }),
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const nodes: GraphQLRepoNode[] =
          gqlData?.data?.user?.repositoriesContributedTo?.nodes ?? [];

        // Exclude own repos
        const externalNodes = nodes.filter(
          (n) => n.owner.login.toLowerCase() !== normalizedUser
        );

        const repos = externalNodes.map(transformGraphQLNode);

        // If the authenticated visitor is viewing their own profile, also add
        // any collaborator or org member repos they contribute to that might
        // not have appeared in GraphQL contributed list.
        const isSelf = session?.login?.toLowerCase() === normalizedUser;
        if (isSelf) {
          try {
            const octokit = new Octokit({ auth: token });
            const { data: affRepos } = await octokit.repos.listForAuthenticatedUser({
              affiliation: "collaborator,organization_member",
              per_page: 50,
              sort: "pushed",
            });

            const existingNames = new Set(repos.map((r) => r.fullName?.toLowerCase() || r.name.toLowerCase()));

            for (const ar of affRepos) {
              const ownerLogin = (ar.owner as { login?: string } | undefined)?.login ?? "";
              const ownerAvatar = (ar.owner as { avatar_url?: string } | undefined)?.avatar_url ?? "";
              if (!ownerLogin || ownerLogin.toLowerCase() === normalizedUser) continue;
              if (existingNames.has(ar.full_name.toLowerCase())) continue;

              existingNames.add(ar.full_name.toLowerCase());
              repos.push({
                name: ar.name,
                fullName: ar.full_name,
                ownerLogin,
                ownerAvatar,
                description: ar.description,
                html_url: ar.html_url,
                stargazers_count: ar.stargazers_count || 0,
                forks_count: ar.forks_count || 0,
                size: ar.size || 0,
                created_at: ar.created_at || new Date().toISOString(),
                updated_at: ar.updated_at || new Date().toISOString(),
                pushed_at: ar.pushed_at || undefined,
                languages: {},
                languagePercentages: [],
                totalBytes: (ar.size || 0) * 1024,
                private: ar.private,
                isContributed: true,
                userContribution: computeContributionStats((ar.size || 0) * 1024, 3),
              });
            }
          } catch {
            // Affiliation fetch is supplementary; continue with GraphQL results
          }
        }

        return NextResponse.json({
          username,
          repos,
          totalCount: repos.length,
          source: "graphql",
        });
      }
    } catch {
      // Fall through to REST fallback
    }
  }

  // 2. REST Fallback (works for unauthenticated visitors or when GraphQL fails)
  try {
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();
    const externalRepos = new Map<string, { owner: string; repo: string }>();

    // 2a. Check public events
    try {
      const { data: events } = await octokit.activity.listPublicEventsForUser({
        username,
        per_page: 100,
      });

      for (const ev of events) {
        if (!ev.repo?.name) continue;
        const [owner, name] = ev.repo.name.split("/");
        if (owner && name && owner.toLowerCase() !== normalizedUser) {
          externalRepos.set(ev.repo.name.toLowerCase(), { owner, repo: name });
        }
      }
    } catch {
      // Events API may fail or rate limit
    }

    // 2b. Check Search API for PRs created by this user
    try {
      const { data: prSearch } = await octokit.search.issuesAndPullRequests({
        q: `type:pr author:${username}`,
        per_page: 40,
        sort: "updated",
      });

      for (const item of prSearch.items) {
        const match = item.repository_url?.match(/repos\/([^/]+)\/([^/]+)$/);
        if (match) {
          const owner = match[1];
          const name = match[2];
          if (owner.toLowerCase() !== normalizedUser) {
            externalRepos.set(`${owner}/${name}`.toLowerCase(), { owner, repo: name });
          }
        }
      }
    } catch {
      // Search API may hit secondary rate limit
    }

    // 2c. Fetch repo details for identified external repos (limit to top 25)
    const targets = Array.from(externalRepos.values()).slice(0, 25);
    const repos: RepoInfo[] = [];

    // Process in small batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async ({ owner, repo }) => {
          try {
            const { data: r } = await octokit.repos.get({ owner, repo });
            let languages: RepoLanguages = {};
            try {
              const { data: langData } = await octokit.repos.listLanguages({ owner, repo });
              languages = langData;
            } catch {
              languages = {};
            }

            const totalBytes = Object.values(languages).reduce((sum, b) => sum + b, 0);
            const languagePercentages = Object.entries(languages).map(([name, bytes]) => ({
              name,
              bytes,
              value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
            }));
            languagePercentages.sort((a, b) => b.value - a.value);

            return {
              name: r.name,
              fullName: r.full_name,
              ownerLogin: r.owner.login,
              ownerAvatar: r.owner.avatar_url,
              description: r.description,
              html_url: r.html_url,
              stargazers_count: r.stargazers_count,
              forks_count: r.forks_count,
              size: r.size,
              created_at: r.created_at,
              updated_at: r.updated_at,
              pushed_at: r.pushed_at || undefined,
              languages,
              languagePercentages,
              totalBytes,
              private: r.private,
              isContributed: true,
              userContribution: computeContributionStats(totalBytes, 2),
            } satisfies RepoInfo;
          } catch {
            return null;
          }
        })
      );

      for (const res of batchResults) {
        if (res) repos.push(res);
      }
    }

    return NextResponse.json({
      username,
      repos,
      totalCount: repos.length,
      source: "rest",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch contributed repositories";
    return NextResponse.json({ error: message, repos: [], totalCount: 0 }, { status: 500 });
  }
}
