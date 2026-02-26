import { Octokit } from "@octokit/rest";
import { getLanguageFromPath } from "./utils";

export interface RepoLanguages {
  [language: string]: number; // bytes
}

export interface RepoInfo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  size: number; // KB
  created_at: string;
  updated_at: string;
  languages: RepoLanguages;
  languagePercentages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
}

export interface UserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

export interface UserAnalysis {
  user: UserProfile;
  repos: RepoInfo[];
  overallLanguages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
  totalRepos: number;
}

export async function fetchUserAnalysis(
  username: string,
  token?: string
): Promise<UserAnalysis> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // Fetch user profile
  const { data: userData } = await octokit.users.getByUsername({ username });

  const user: UserProfile = {
    login: userData.login,
    name: userData.name,
    avatar_url: userData.avatar_url,
    html_url: userData.html_url,
    bio: userData.bio,
    public_repos: userData.public_repos,
    followers: userData.followers,
    following: userData.following,
  };

  // Fetch all public repos (paginated), only non-forks owned by the user
  let page = 1;
  const perPage = 100;
  let allRepos: Awaited<
    ReturnType<typeof octokit.repos.listForUser>
  >["data"] = [];

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

  // Filter: only non-fork repos
  const ownRepos = allRepos.filter((r) => !r.fork);

  // Fetch languages for each repo in parallel (batched)
  const BATCH_SIZE = 10;
  const repoInfos: RepoInfo[] = [];

  for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
    const batch = ownRepos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (repo) => {
        const { data: languages } = await octokit.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });

        const totalBytes = Object.values(languages).reduce(
          (sum, b) => sum + b,
          0
        );

        const languagePercentages = Object.entries(languages).map(
          ([name, bytes]) => ({
            name,
            value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
            bytes,
          })
        );

        // Sort by percentage descending
        languagePercentages.sort((a, b) => b.value - a.value);

        return {
          name: repo.name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count ?? 0,
          forks_count: repo.forks_count ?? 0,
          size: repo.size ?? 0,
          created_at: repo.created_at ?? "",
          updated_at: repo.updated_at ?? "",
          languages,
          languagePercentages,
          totalBytes,
        } satisfies RepoInfo;
      })
    );
    repoInfos.push(...results);
  }

  // Calculate overall language distribution
  const overallMap: Record<string, number> = {};
  let totalBytes = 0;

  for (const repo of repoInfos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      overallMap[lang] = (overallMap[lang] || 0) + bytes;
      totalBytes += bytes;
    }
  }

  const overallLanguages = Object.entries(overallMap)
    .map(([name, bytes]) => ({
      name,
      value:
        totalBytes > 0
          ? Math.round((bytes / totalBytes) * 10000) / 100
          : 0,
      bytes,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    user,
    repos: repoInfos,
    overallLanguages,
    totalBytes,
    totalRepos: repoInfos.length,
  };
}

// --- Commit History Language Analysis ---

export interface CommitLanguageSnapshot {
  sha: string;
  shortSha: string;
  date: string;
  message: string;
  languages: Record<string, number>; // lang -> bytes
  languagePercentages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
}

export interface RepoCommitHistory {
  repoName: string;
  snapshots: CommitLanguageSnapshot[];
  allLanguages: string[]; // union of all languages across snapshots
}

export async function fetchRepoCommitHistory(
  owner: string,
  repo: string,
  token?: string,
  limit: number = 15
): Promise<RepoCommitHistory> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  // Fetch recent commits
  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: Math.min(limit, 30),
  });

  // Sample commits evenly if there are many (take first, some middle, and last)
  let selectedCommits = commits;
  if (commits.length > limit) {
    const step = Math.floor(commits.length / limit);
    selectedCommits = [];
    for (let i = 0; i < commits.length && selectedCommits.length < limit; i += step) {
      selectedCommits.push(commits[i]);
    }
    // Always include the last (oldest)
    if (selectedCommits[selectedCommits.length - 1] !== commits[commits.length - 1]) {
      selectedCommits.push(commits[commits.length - 1]);
    }
  }

  // For each commit, get the tree and compute languages
  const snapshots: CommitLanguageSnapshot[] = [];
  const allLangsSet = new Set<string>();

  for (const commit of selectedCommits) {
    try {
      const { data: tree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: commit.sha,
        recursive: "1",
      });

      const langMap: Record<string, number> = {};
      let total = 0;

      for (const item of tree.tree) {
        if (item.type === "blob" && item.path && item.size) {
          const lang = getLanguageFromPath(item.path);
          if (lang) {
            langMap[lang] = (langMap[lang] || 0) + item.size;
            total += item.size;
            allLangsSet.add(lang);
          }
        }
      }

      const languagePercentages = Object.entries(langMap)
        .map(([name, bytes]) => ({
          name,
          value: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
          bytes,
        }))
        .sort((a, b) => b.value - a.value);

      snapshots.push({
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        date: commit.commit.author?.date || commit.commit.committer?.date || "",
        message: commit.commit.message.split("\n")[0], // first line only
        languages: langMap,
        languagePercentages,
        totalBytes: total,
      });
    } catch {
      // Skip if tree fetch fails (e.g. too large)
      continue;
    }
  }

  // Reverse so oldest is first (chronological order)
  snapshots.reverse();

  return {
    repoName: repo,
    snapshots,
    allLanguages: Array.from(allLangsSet),
  };
}
