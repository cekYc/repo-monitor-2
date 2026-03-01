import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { serverCache, extensionsCacheKey } from "@/lib/cache";

export const runtime = "nodejs";

interface ExtensionResult {
  extension: string;
  language: string;
  color: string;
  files: { repo: string; path: string }[];
  totalFiles: number;
  totalBytes: number;
}

interface ScanResult {
  username: string;
  extensions: ExtensionResult[];
  totalFilesFound: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const token = searchParams.get("token");
  const extensionsParam = searchParams.get("extensions"); // JSON: [{ ext: ".cky", lang: "Ceky Lang", color: "#ff6b35" }]

  if (!username || !extensionsParam) {
    return NextResponse.json({ error: "username and extensions required" }, { status: 400 });
  }

  let customExtensions: { ext: string; lang: string; color: string }[];
  try {
    customExtensions = JSON.parse(extensionsParam);
    if (!Array.isArray(customExtensions) || customExtensions.length === 0) {
      throw new Error("Invalid extensions format");
    }
  } catch {
    return NextResponse.json({ error: "Invalid extensions JSON" }, { status: 400 });
  }

  // Cache key
  const cacheKey = extensionsCacheKey(username, extensionsParam);
  const cached = serverCache.get<ScanResult>(cacheKey);
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

    // Build extension set for fast lookup
    const extMap = new Map<string, { lang: string; color: string }>();
    for (const ce of customExtensions) {
      const ext = ce.ext.startsWith(".") ? ce.ext.toLowerCase() : `.${ce.ext.toLowerCase()}`;
      extMap.set(ext, { lang: ce.lang, color: ce.color });
    }

    // Scan repos for matching files using Trees API
    const resultMap = new Map<string, ExtensionResult>();
    for (const ext of extMap.keys()) {
      const info = extMap.get(ext)!;
      resultMap.set(ext, {
        extension: ext,
        language: info.lang,
        color: info.color,
        files: [],
        totalFiles: 0,
        totalBytes: 0,
      });
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
      const batch = ownRepos.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (repo) => {
          try {
            const { data: tree } = await octokit.git.getTree({
              owner: username,
              repo: repo.name,
              tree_sha: repo.default_branch || "main",
              recursive: "1",
            });

            for (const item of tree.tree) {
              if (item.type !== "blob" || !item.path) continue;

              const filename = item.path.split("/").pop() || "";
              const dotIdx = filename.lastIndexOf(".");
              if (dotIdx === -1) continue;

              const ext = filename.substring(dotIdx).toLowerCase();
              const entry = resultMap.get(ext);
              if (entry) {
                entry.totalFiles++;
                entry.totalBytes += item.size || 0;
                // Keep first 20 files as samples
                if (entry.files.length < 20) {
                  entry.files.push({ repo: repo.name, path: item.path });
                }
              }
            }
          } catch {
            // Skip repos where tree fetch fails (e.g., empty repos)
          }
        })
      );
    }

    const extensions = Array.from(resultMap.values()).filter((e) => e.totalFiles > 0);
    const totalFilesFound = extensions.reduce((sum, e) => sum + e.totalFiles, 0);

    const result: ScanResult = {
      username,
      extensions,
      totalFilesFound,
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
