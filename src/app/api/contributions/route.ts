import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const runtime = "nodejs";

// GraphQL query for full 365-day contribution calendar (requires token)
const CONTRIBUTIONS_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchViaGraphQL(username: string, token: string) {
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
      query: CONTRIBUTIONS_QUERY,
      variables: {
        username,
        from: from.toISOString(),
        to: now.toISOString(),
      },
    }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return null;

  const days: { date: string; count: number }[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
    }
  }

  // Keep only last 365 days
  const cutoff = from.toISOString().split("T")[0];
  const filtered = days.filter((d) => d.date >= cutoff);

  const totalEvents = calendar.totalContributions;
  const maxCount = Math.max(...filtered.map((d) => d.count), 1);

  return { days: filtered, totalEvents, maxCount, source: "graphql" };
}

async function fetchViaEvents(username: string, token?: string) {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // Fetch up to 10 pages (1000 events) — Events API still limited to ~90 days
  const allEvents = [];
  for (let page = 1; page <= 10; page++) {
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
      page,
    });
    allEvents.push(...events);
    if (events.length < 100) break;
  }

  // Build a map: date -> count
  const dateMap: Record<string, number> = {};
  for (const event of allEvents) {
    if (!event.created_at) continue;
    const date = event.created_at.split("T")[0];
    dateMap[date] = (dateMap[date] || 0) + 1;
  }

  // Fill in last 365 days
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: dateMap[key] || 0 });
  }

  const totalEvents = allEvents.length;
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return { days, totalEvents, maxCount, source: "events" };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");

  if (!username) {
    return NextResponse.json(
      { error: "username parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    // Try GraphQL first (full 365-day data) if token is available
    if (token) {
      const graphqlResult = await fetchViaGraphQL(username, token);
      if (graphqlResult) {
        return NextResponse.json(graphqlResult);
      }
    }

    // Fall back to Events API (limited to ~90 days)
    const eventsResult = await fetchViaEvents(username, token || undefined);
    return NextResponse.json(eventsResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
