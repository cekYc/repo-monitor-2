import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { resolveToken } from "@/lib/request-token";
import { buildSampleDailyActivity } from "@/lib/sample-analysis";
import type {
  DailyActivityEntry,
  DailyCommitDetail,
  DailyRepoCommitActivity,
  DailyRepoCreated,
  RepoActivitySummary,
  UserDailyActivityResponse,
} from "@/lib/github";

export const runtime = "nodejs";

const DAILY_ACTIVITY_GRAPHQL = `
  query($username: String!) {
    user(login: $username) {
      login
      repositories(
        first: 50,
        ownerAffiliations: [OWNER],
        isFork: false,
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          nameWithOwner
          description
          url
          isPrivate
          isFork
          stargazerCount
          diskUsage
          createdAt
          pushedAt
          owner {
            login
            avatarUrl
          }
          languages(first: 3, orderBy: { field: SIZE, direction: DESC }) {
            totalSize
            edges {
              size
              node {
                name
              }
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 35) {
                  totalCount
                  nodes {
                    oid
                    messageHeadline
                    committedDate
                    additions
                    deletions
                    url
                    author {
                      name
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      repositoriesContributedTo(
        first: 20,
        contributionTypes: [COMMIT],
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          nameWithOwner
          description
          url
          isPrivate
          isFork
          stargazerCount
          diskUsage
          createdAt
          pushedAt
          owner {
            login
            avatarUrl
          }
          languages(first: 3, orderBy: { field: SIZE, direction: DESC }) {
            totalSize
            edges {
              size
              node {
                name
              }
            }
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 30) {
                  totalCount
                  nodes {
                    oid
                    messageHeadline
                    committedDate
                    additions
                    deletions
                    url
                    author {
                      name
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface GqlCommitNode {
  oid: string;
  messageHeadline: string;
  committedDate: string;
  additions: number;
  deletions: number;
  url: string;
  author?: {
    name?: string | null;
    user?: {
      login?: string | null;
    } | null;
  } | null;
}

interface GqlRepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  diskUsage?: number;
  createdAt: string;
  pushedAt?: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  languages?: {
    totalSize: number;
    edges: {
      size: number;
      node: { name: string };
    }[];
  };
  defaultBranchRef?: {
    target?: {
      history?: {
        totalCount?: number;
        nodes?: GqlCommitNode[];
      };
    };
  };
}

function ensureDay(map: Map<string, DailyActivityEntry>, date: string): DailyActivityEntry {
  let entry = map.get(date);
  if (!entry) {
    entry = {
      date,
      reposCreated: [],
      repoCommits: [],
      totalCommits: 0,
      totalAdditions: 0,
      totalDeletions: 0,
    };
    map.set(date, entry);
  }
  return entry;
}

function finalizeResponse(
  username: string,
  dayMap: Map<string, DailyActivityEntry>,
  repoSummaries: RepoActivitySummary[],
  source: "graphql" | "rest"
): UserDailyActivityResponse {
  const days = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  for (const day of days) {
    day.repoCommits.sort(
      (a, b) =>
        b.additions + b.deletions - (a.additions + a.deletions) ||
        b.commitCount - a.commitCount
    );
    day.totalCommits = day.repoCommits.reduce((s, r) => s + r.commitCount, 0);
    day.totalAdditions = day.repoCommits.reduce((s, r) => s + r.additions, 0);
    day.totalDeletions = day.repoCommits.reduce((s, r) => s + r.deletions, 0);
  }

  repoSummaries.sort(
    (a, b) =>
      b.totalCommits - a.totalCommits ||
      b.currentRepoBytes - a.currentRepoBytes
  );

  const totals = {
    activeDays: days.length,
    reposCreated: days.reduce((s, d) => s + d.reposCreated.length, 0),
    totalCommits: repoSummaries.reduce((s, r) => s + r.totalCommits, 0),
    totalAdditions: repoSummaries.reduce((s, r) => s + r.totalAdditions, 0),
    totalDeletions: repoSummaries.reduce((s, r) => s + r.totalDeletions, 0),
    linesCommits: repoSummaries.reduce((s, r) => s + r.linesCommits, 0),
  };

  return {
    username,
    days,
    repoSummaries,
    totals,
    source,
  };
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username) {
    return NextResponse.json({ error: "username parameter is required" }, { status: 400 });
  }

  const normalizedUser = username.toLowerCase();
  if (normalizedUser === "sample" || normalizedUser.startsWith("octo-sample")) {
    return NextResponse.json(buildSampleDailyActivity());
  }

  const { token } = await resolveToken(request);
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // 1. Try GraphQL first when token is available
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
          query: DAILY_ACTIVITY_GRAPHQL,
          variables: { username },
        }),
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const userNode = gqlData?.data?.user;

        if (userNode) {
          const ownedNodes: GqlRepoNode[] = userNode.repositories?.nodes ?? [];
          const contributedNodes: GqlRepoNode[] = (
            userNode.repositoriesContributedTo?.nodes ?? []
          ).filter((n: GqlRepoNode) => n.owner?.login?.toLowerCase() !== normalizedUser);

          const dayMap = new Map<string, DailyActivityEntry>();
          const repoSummaries: RepoActivitySummary[] = [];
          const seenRepos = new Set<string>();
          const seenCommitShas = new Set<string>();

          // Process older repos first so inherited/cloned commit SHAs are attributed to the original repo
          const allRepoEntries = [
            ...ownedNodes.map((node) => ({ node, isContributed: false })),
            ...contributedNodes.map((node) => ({ node, isContributed: true })),
          ].sort((a, b) => (a.node.createdAt || "").localeCompare(b.node.createdAt || ""));

          for (const { node, isContributed } of allRepoEntries) {
            if (!node || !node.nameWithOwner) continue;
            const key = node.nameWithOwner.toLowerCase();
            if (seenRepos.has(key)) continue;
            seenRepos.add(key);

            const totalRepoBytes =
              node.languages?.totalSize || (node.diskUsage ? node.diskUsage * 1024 : 0);
            const primaryLanguage = node.languages?.edges?.[0]?.node?.name ?? null;
            const createdDay = node.createdAt ? node.createdAt.slice(0, 10) : "";

            // Record repo creation on its exact creation date (for owned repos)
            if (!isContributed && createdDay) {
              const dayEntry = ensureDay(dayMap, createdDay);
              const createdItem: DailyRepoCreated = {
                repoName: node.name,
                fullName: node.nameWithOwner,
                htmlUrl: node.url,
                description: node.description,
                createdAt: node.createdAt,
                private: node.isPrivate,
                primaryLanguage,
                totalBytes: totalRepoBytes,
                stars: node.stargazerCount || 0,
              };
              dayEntry.reposCreated.push(createdItem);
            }

            // Process commits in repository history
            const rawCommits = node.defaultBranchRef?.target?.history?.nodes ?? [];
            const userCommits = rawCommits.filter((c) => {
              if (!c.committedDate) return false;
              const commitDay = c.committedDate.slice(0, 10);
              // Do not attribute commits dated before the repository itself was created
              if (createdDay && commitDay < createdDay) return false;
              // Do not duplicate commits inherited from an older repository
              if (seenCommitShas.has(c.oid)) return false;

              const authorLogin = c.author?.user?.login?.toLowerCase();
              const authorName = c.author?.name?.toLowerCase();
              if (authorLogin === normalizedUser || authorName === normalizedUser) {
                return true;
              }
              // In owned repos, if GitHub user mapping is unlinked on git config, include it
              if (!isContributed && !authorLogin) {
                return true;
              }
              return false;
            });

            const repoDayCommits = new Map<string, DailyCommitDetail[]>();
            let repoTotalAdditions = 0;
            let repoTotalDeletions = 0;

            for (const c of userCommits) {
              if (!c.committedDate) continue;
              seenCommitShas.add(c.oid);
              const dateKey = c.committedDate.slice(0, 10);
              const additions = c.additions || 0;
              const deletions = c.deletions || 0;

              repoTotalAdditions += additions;
              repoTotalDeletions += deletions;

              const detail: DailyCommitDetail = {
                sha: c.oid,
                shortSha: c.oid.slice(0, 7),
                message: c.messageHeadline || "Commit",
                timestamp: c.committedDate,
                url: c.url,
                additions,
                deletions,
              };

              const list = repoDayCommits.get(dateKey) ?? [];
              list.push(detail);
              repoDayCommits.set(dateKey, list);
            }

            for (const [dateKey, commits] of repoDayCommits.entries()) {
              const dayEntry = ensureDay(dayMap, dateKey);
              const additions = commits.reduce((s, c) => s + (c.additions ?? 0), 0);
              const deletions = commits.reduce((s, c) => s + (c.deletions ?? 0), 0);

              const repoCommitEntry: DailyRepoCommitActivity = {
                repoName: node.name,
                fullName: node.nameWithOwner,
                ownerLogin: node.owner.login,
                ownerAvatar: node.owner.avatarUrl,
                htmlUrl: node.url,
                isContributed,
                private: node.isPrivate,
                primaryLanguage,
                totalRepoBytes,
                commitCount: commits.length,
                additions,
                deletions,
                linesKnown: true,
                commits,
              };

              dayEntry.repoCommits.push(repoCommitEntry);
            }

            const sortedDates = Array.from(repoDayCommits.keys()).sort();
            const historyTotal = node.defaultBranchRef?.target?.history?.totalCount ?? userCommits.length;
            const effectiveTotalCommits = isContributed
              ? userCommits.length
              : Math.max(userCommits.length, historyTotal);

            if (!isContributed || userCommits.length > 0) {
              repoSummaries.push({
                repoName: node.name,
                fullName: node.nameWithOwner,
                htmlUrl: node.url,
                isContributed,
                private: node.isPrivate,
                primaryLanguage,
                createdAt: node.createdAt,
                firstCommitDate: sortedDates[0] ?? (node.createdAt ? node.createdAt.slice(0, 10) : null),
                lastCommitDate:
                  sortedDates[sortedDates.length - 1] ??
                  (node.pushedAt ? node.pushedAt.slice(0, 10) : null),
                activeDays: Math.max(sortedDates.length, userCommits.length > 0 ? 1 : 0),
                totalCommits: effectiveTotalCommits,
                totalAdditions: repoTotalAdditions,
                totalDeletions: repoTotalDeletions,
                linesCommits: userCommits.length,
                currentRepoBytes: totalRepoBytes,
              });
            }
          }

          return NextResponse.json(
            finalizeResponse(username, dayMap, repoSummaries, "graphql")
          );
        }
      }
    } catch {
      // Fall through to REST fallback
    }
  }

  // 2. REST Fallback (works without token or when GraphQL fails)
  try {
    const dayMap = new Map<string, DailyActivityEntry>();
    const repoSummaries: RepoActivitySummary[] = [];

    const { data: repos } = await octokit.repos.listForUser({
      username,
      type: "owner",
      per_page: 100,
      sort: "pushed",
    });

    const ownRepos = repos.filter((r) => !r.fork);

    // Record creation dates for all owned repos
    for (const r of ownRepos) {
      if (!r.created_at) continue;
      const createdDay = r.created_at.slice(0, 10);
      const dayEntry = ensureDay(dayMap, createdDay);
      const totalBytes = (r.size || 0) * 1024;
      dayEntry.reposCreated.push({
        repoName: r.name,
        fullName: r.full_name,
        htmlUrl: r.html_url,
        description: r.description,
        createdAt: r.created_at,
        private: r.private ?? false,
        primaryLanguage: r.language ?? null,
        totalBytes,
        stars: r.stargazers_count ?? 0,
      });
    }

    // Fetch commit histories for owned repos (up to 35 repos in batches, sorted oldest-created first for SHA deduplication)
    const targetRepos = [...ownRepos.slice(0, 35)].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "")
    );
    const seenCommitShas = new Set<string>();
    const BATCH_SIZE = 7;

    for (let i = 0; i < targetRepos.length; i += BATCH_SIZE) {
      const batch = targetRepos.slice(i, i + BATCH_SIZE);
      const batchFetched = await Promise.all(
        batch.map(async (r) => {
          try {
            const { data: commits } = await octokit.repos.listCommits({
              owner: username,
              repo: r.name,
              per_page: 30,
            });
            return { repo: r, commits };
          } catch {
            return null;
          }
        })
      );

      for (const item of batchFetched) {
        if (!item) continue;
        const { repo: r, commits: rawCommits } = item;
        const createdDay = r.created_at ? r.created_at.slice(0, 10) : "";

        // Filter out commits dated before the repo was created or inherited from an older repo
        const commits = rawCommits.filter((c) => {
          const dateIso = c.commit.author?.date || c.commit.committer?.date;
          if (!dateIso) return false;
          const dateKey = dateIso.slice(0, 10);
          if (createdDay && dateKey < createdDay) return false;
          if (seenCommitShas.has(c.sha)) return false;
          return true;
        });

        const totalRepoBytes = (r.size || 0) * 1024;
        const repoDayCommits = new Map<string, DailyCommitDetail[]>();

        // The REST commit list carries no line stats (that would cost one request
        // per commit), so additions/deletions stay unknown rather than estimated.
        for (const c of commits) {
          seenCommitShas.add(c.sha);
          const dateIso = c.commit.author?.date || c.commit.committer?.date;
          if (!dateIso) continue;
          const dateKey = dateIso.slice(0, 10);

          const detail: DailyCommitDetail = {
            sha: c.sha,
            shortSha: c.sha.slice(0, 7),
            message: (c.commit.message || "Commit").split("\n")[0],
            timestamp: dateIso,
            url: c.html_url,
            additions: null,
            deletions: null,
          };

          const list = repoDayCommits.get(dateKey) ?? [];
          list.push(detail);
          repoDayCommits.set(dateKey, list);
        }

        for (const [dateKey, dayCommits] of repoDayCommits.entries()) {
          const dayEntry = ensureDay(dayMap, dateKey);

          dayEntry.repoCommits.push({
            repoName: r.name,
            fullName: r.full_name,
            ownerLogin: r.owner.login,
            ownerAvatar: r.owner.avatar_url,
            htmlUrl: r.html_url,
            isContributed: false,
            private: r.private ?? false,
            primaryLanguage: r.language ?? null,
            totalRepoBytes,
            commitCount: dayCommits.length,
            additions: 0,
            deletions: 0,
            linesKnown: false,
            commits: dayCommits,
          });
        }

        const sortedDates = Array.from(repoDayCommits.keys()).sort();
        repoSummaries.push({
          repoName: r.name,
          fullName: r.full_name,
          htmlUrl: r.html_url,
          isContributed: false,
          private: r.private ?? false,
          primaryLanguage: r.language ?? null,
          createdAt: r.created_at || "",
          firstCommitDate:
            sortedDates[0] ?? (r.created_at ? r.created_at.slice(0, 10) : null),
          lastCommitDate:
            sortedDates[sortedDates.length - 1] ??
            (r.pushed_at ? r.pushed_at.slice(0, 10) : null),
          activeDays: Math.max(sortedDates.length, commits.length > 0 ? 1 : 0),
          totalCommits: commits.length,
          totalAdditions: 0,
          totalDeletions: 0,
          linesCommits: 0,
          currentRepoBytes: totalRepoBytes,
        });
      }
    }

    return NextResponse.json(finalizeResponse(username, dayMap, repoSummaries, "rest"));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch daily activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

