import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

export const runtime = "nodejs";

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

  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    // Fetch recent public events (up to 300, 3 pages)
    const allEvents = [];
    for (let page = 1; page <= 3; page++) {
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
      const date = event.created_at.split("T")[0]; // YYYY-MM-DD
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

    return NextResponse.json({ days, totalEvents, maxCount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
