import { NextRequest } from "next/server";
import { Octokit } from "@octokit/rest";
import { getLanguageColor } from "@/lib/utils";
import { serverCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const token = request.nextUrl.searchParams.get("token");

  // Check badge cache first
  const cacheKey = `badge:${username.toLowerCase()}`;
  const cached = serverCache.get<string>(cacheKey);
  if (cached.status === "fresh" || cached.status === "stale") {
    return new Response(cached.data, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Cache": cached.status === "fresh" ? "HIT" : "STALE",
      },
    });
  }

  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  try {
    // Fetch user's repos
    let page = 1;
    const perPage = 100;
    let allRepos: Awaited<ReturnType<typeof octokit.repos.listForUser>>["data"] = [];

    while (true) {
      const { data: repos } = await octokit.repos.listForUser({
        username,
        type: "owner",
        per_page: perPage,
        page,
        sort: "updated",
      });
      allRepos = allRepos.concat(repos);
      if (repos.length < perPage) break;
      page++;
    }

    const ownRepos = allRepos.filter((r) => !r.fork);

    // Fetch languages for each repo
    const langMap: Record<string, number> = {};
    let totalBytes = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
      const batch = ownRepos.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (repo) => {
          const { data: languages } = await octokit.repos.listLanguages({
            owner: username,
            repo: repo.name,
          });
          return languages;
        })
      );
      for (const languages of results) {
        for (const [lang, bytes] of Object.entries(languages)) {
          langMap[lang] = (langMap[lang] || 0) + bytes;
          totalBytes += bytes;
        }
      }
    }

    const sortedLangs = Object.entries(langMap)
      .map(([name, bytes]) => ({
        name,
        pct: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
        bytes,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);

    // Generate SVG badge
    const badgeWidth = 460;
    const badgeHeight = 28 + sortedLangs.length * 24 + 20;
    const barHeight = 10;
    const barY = 24;

    let barSegments = "";
    let x = 16;
    const barWidth = badgeWidth - 32;

    for (let i = 0; i < sortedLangs.length; i++) {
      const lang = sortedLangs[i];
      const w = Math.max((lang.pct / 100) * barWidth, 2);
      const color = getLanguageColor(lang.name, i);
      const rx = i === 0 ? 5 : 0;
      const rxEnd = i === sortedLangs.length - 1 ? 5 : 0;
      barSegments += `<rect x="${x}" y="${barY}" width="${w}" height="${barHeight}" rx="${rx || rxEnd}" fill="${color}"/>`;
      x += w;
    }

    let legendItems = "";
    const legendStartY = barY + barHeight + 16;
    const colWidth = badgeWidth / 2;

    for (let i = 0; i < sortedLangs.length; i++) {
      const lang = sortedLangs[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = 16 + col * colWidth;
      const ly = legendStartY + row * 20;
      const color = getLanguageColor(lang.name, i);

      legendItems += `
        <circle cx="${lx + 5}" cy="${ly + 5}" r="5" fill="${color}"/>
        <text x="${lx + 16}" y="${ly + 9}" fill="#586069" font-size="11" font-family="system-ui,-apple-system,sans-serif">${lang.name} ${lang.pct}%</text>
      `;
    }

    const totalHeight = legendStartY + Math.ceil(sortedLangs.length / 2) * 20 + 8;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="${totalHeight}" viewBox="0 0 ${badgeWidth} ${totalHeight}">
  <rect width="${badgeWidth}" height="${totalHeight}" rx="8" fill="#ffffff" stroke="#e1e4e8" stroke-width="1"/>
  <text x="16" y="16" fill="#24292f" font-size="12" font-weight="600" font-family="system-ui,-apple-system,sans-serif">${username}'s Language Distribution — Repo Monitor</text>
  ${barSegments}
  ${legendItems}
</svg>`;

    // Cache the SVG for 1 hour / 4 hours max
    serverCache.set(cacheKey, svg, 60 * 60 * 1000, 4 * 60 * 60 * 1000);

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="30" viewBox="0 0 300 30">
  <rect width="300" height="30" rx="5" fill="#fef2f2" stroke="#fca5a5" stroke-width="1"/>
  <text x="10" y="20" fill="#dc2626" font-size="12" font-family="system-ui,-apple-system,sans-serif">Error: ${message.replace(/[<>&"]/g, "")}</text>
</svg>`;

    return new Response(errorSvg, {
      status: 404,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}
