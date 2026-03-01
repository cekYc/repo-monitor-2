import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { serverCache, personaCacheKey } from "@/lib/cache";

export const runtime = "nodejs";

// GraphQL: commit timestamps for the last year
const COMMIT_TIMES_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        commitContributionsByRepository(maxRepositories: 50) {
          repository { name }
          contributions(first: 100, orderBy: {direction: DESC}) {
            nodes {
              occurredAt
            }
          }
        }
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            nodes { name }
          }
        }
      }
    }
  }
`;

interface Badge {
  id: string;
  earned: boolean;
  value?: string;
}

interface PersonaResult {
  username: string;
  commitHours: number[]; // 24 slots (0-23)
  commitDays: number[];  // 7 slots (0=Sun, 6=Sat)
  badges: Badge[];
  peakHour: number;
  peakDay: number;
  totalCommits: number;
  languageCount: number;
  longestStreak: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  // Check cache
  const cacheKey = personaCacheKey(username);
  const forceRefresh = searchParams.get("refresh") === "1";

  if (!forceRefresh) {
    const cached = serverCache.get<PersonaResult>(cacheKey);
    if (cached.status === "fresh" || cached.status === "stale") {
      return NextResponse.json(cached.data, {
        headers: { "X-Cache": cached.status === "fresh" ? "HIT" : "STALE" },
      });
    }
  } else {
    serverCache.delete(cacheKey);
  }

  try {
    const commitHours = new Array(24).fill(0);
    let commitDays = new Array(7).fill(0);
    let totalCommits = 0;
    let languageCount = 0;
    let longestStreak = 0;
    let refactorRatio = 0; // deletions / additions
    let graphqlSuccess = false;

    // --- Step 1: Try GraphQL for accurate totals, streak, calendar (requires token) ---
    if (token) {
      try {
        const now = new Date();
        const from = new Date(now);
        from.setFullYear(from.getFullYear() - 1);

        const res = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: COMMIT_TIMES_QUERY,
            variables: {
              username,
              from: from.toISOString(),
              to: now.toISOString(),
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const collection = json?.data?.user?.contributionsCollection;
          const repos = json?.data?.user?.repositories?.nodes;

          if (collection && (collection.totalCommitContributions || 0) > 0) {
            graphqlSuccess = true;
            totalCommits = collection.totalCommitContributions || 0;

            // Streak from calendar
            const allDays: { date: string; count: number }[] = [];
            for (const week of collection.contributionCalendar?.weeks || []) {
              for (const day of week.contributionDays) {
                allDays.push({ date: day.date, count: day.contributionCount });
              }
            }

            let currentStreak = 0;
            for (const day of allDays) {
              if (day.count > 0) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
              } else {
                currentStreak = 0;
              }
            }

            // Day distribution from calendar (accurate)
            const dayTotals = new Array(7).fill(0);
            for (const week of collection.contributionCalendar?.weeks || []) {
              for (const day of week.contributionDays) {
                dayTotals[day.weekday] += day.contributionCount;
              }
            }
            commitDays = dayTotals;
          }

          // Count unique languages from GraphQL
          if (repos) {
            const langSet = new Set<string>();
            for (const repo of repos) {
              for (const lang of repo.languages?.nodes || []) {
                langSet.add(lang.name);
              }
            }
            languageCount = langSet.size;
          }
        }
      } catch {
        // GraphQL failed — will fall through to Events API
      }
    }

    // --- Step 2: Always use Events API for commit HOUR distribution ---
    // GraphQL contributionsByRepository only has dates (no times), so we need Events API for hours
    {
      const octokit = token ? new Octokit({ auth: token }) : new Octokit();
      const allEvents = [];
      for (let page = 1; page <= 10; page++) {
        try {
          const { data: events } = await octokit.activity.listPublicEventsForUser({
            username,
            per_page: 100,
            page,
          });
          allEvents.push(...events);
          if (events.length < 100) break;
        } catch {
          break; // Rate limit or other error — use what we have
        }
      }

      // Extract commit hours from push events (these have actual timestamps)
      let eventsCommitCount = 0;
      for (const event of allEvents) {
        if (event.type === "PushEvent" && event.created_at) {
          const payload = event.payload as { commits?: { sha: string }[] };
          const commitCount = payload.commits?.length || 1;
          const date = new Date(event.created_at);
          commitHours[date.getUTCHours()] += commitCount;
          eventsCommitCount += commitCount;
        }
      }

      // If GraphQL didn't work, use Events API for everything
      if (!graphqlSuccess) {
        totalCommits = eventsCommitCount;

        // Day distribution from events
        for (const event of allEvents) {
          if (event.type === "PushEvent" && event.created_at) {
            const payload = event.payload as { commits?: { sha: string }[] };
            const commitCount = payload.commits?.length || 1;
            const date = new Date(event.created_at);
            commitDays[date.getUTCDay()] += commitCount;
          }
        }

        // Language count from repos
        if (languageCount === 0) {
          try {
            const { data: repos } = await octokit.repos.listForUser({
              username,
              type: "owner",
              per_page: 100,
              sort: "updated",
            });
            const langSet = new Set<string>();
            for (const repo of repos.filter((r) => !r.fork)) {
              if (repo.language) langSet.add(repo.language);
            }
            languageCount = langSet.size;
          } catch {
            // ignore
          }
        }

        // Streak from events
        const dateSet = new Set(
          allEvents
            .filter((e) => e.created_at)
            .map((e) => e.created_at!.split("T")[0])
        );
        const dates = Array.from(dateSet).sort();
        let streak = 0;
        for (let i = 0; i < dates.length; i++) {
          if (i === 0) {
            streak = 1;
          } else {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) streak++;
            else streak = 1;
          }
          longestStreak = Math.max(longestStreak, streak);
        }
      }

      // Estimate refactor ratio from push events
      let additions = 0;
      let deletions = 0;
      for (const event of allEvents) {
        if (event.type === "PushEvent") {
          const payload = event.payload as { size?: number; distinct_size?: number };
          additions += payload.size || 0;
          deletions += (payload.size || 0) - (payload.distinct_size || 0);
        }
      }
      refactorRatio = additions > 0 ? deletions / additions : 0;
    }

    // Find peak hour and day
    const peakHour = commitHours.indexOf(Math.max(...commitHours));
    const peakDay = commitDays.indexOf(Math.max(...commitDays));

    // Calculate weekend percentage
    const totalDayCommits = commitDays.reduce((a, b) => a + b, 0);
    const weekendCommits = commitDays[0] + commitDays[6]; // Sun + Sat
    const weekendPct = totalDayCommits > 0 ? weekendCommits / totalDayCommits : 0;

    // Night commits (00:00 - 04:59)
    const nightCommits = commitHours.slice(0, 5).reduce((a, b) => a + b, 0);
    const totalHourCommits = commitHours.reduce((a, b) => a + b, 0);
    const nightPct = totalHourCommits > 0 ? nightCommits / totalHourCommits : 0;

    // Early bird (05:00 - 08:59)
    const earlyCommits = commitHours.slice(5, 9).reduce((a, b) => a + b, 0);
    const earlyPct = totalHourCommits > 0 ? earlyCommits / totalHourCommits : 0;

    // Build badges
    const badges: Badge[] = [
      {
        id: "nightOwl",
        earned: nightPct >= 0.15,
        value: `${Math.round(nightPct * 100)}%`,
      },
      {
        id: "earlyBird",
        earned: earlyPct >= 0.15,
        value: `${Math.round(earlyPct * 100)}%`,
      },
      {
        id: "weekendWarrior",
        earned: weekendPct >= 0.30,
        value: `${Math.round(weekendPct * 100)}%`,
      },
      {
        id: "polyglot",
        earned: languageCount >= 10,
        value: `${languageCount}`,
      },
      {
        id: "streaker",
        earned: longestStreak >= 7,
        value: `${longestStreak}`,
      },
      {
        id: "refactorMaster",
        earned: refactorRatio > 0.4,
        value: `${Math.round(refactorRatio * 100)}%`,
      },
    ];

    const result: PersonaResult = {
      username,
      commitHours,
      commitDays,
      badges,
      peakHour,
      peakDay,
      totalCommits,
      languageCount,
      longestStreak,
    };

    // Cache for 30 min / 2 hr
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
