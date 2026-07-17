import { Octokit } from "@octokit/rest";
import { getLanguageFromPath } from "./utils";

export interface RepoLanguages {
  [language: string]: number; // bytes
}

export interface RepoAdvancedMetrics {
  activeDays: number;
  totalDurationDays: number;
  developmentDensity: number; // activeDays / totalDurationDays
  commitDates: string[]; // array of ISO dates or YYYY-MM-DD
  projectScore: number;
  totalCommits: number;
  lastMaintenance: string | null;
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
  private: boolean;
  advancedMetrics?: RepoAdvancedMetrics;
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
  token?: string,
  onProgress?: (current: number, total: number, repoName: string) => void
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

  // Token varsa authenticated kullanıcının kendi repoları mı kontrol et
  let isOwnProfile = false;
  if (token) {
    try {
      const { data: authUser } = await octokit.users.getAuthenticated();
      isOwnProfile = authUser.login.toLowerCase() === username.toLowerCase();
    } catch {
      isOwnProfile = false;
    }
  }

  let page = 1;
  const perPage = 100;
  let allRepos: {
    name: string;
    fork: boolean;
    description: string | null;
    html_url: string;
    stargazers_count?: number;
    forks_count?: number;
    size?: number;
    created_at?: string | null;
    updated_at?: string | null;
    private: boolean;
  }[] = [];

  if (isOwnProfile && token) {
    // Kendi profili → private repolar dahil listForAuthenticatedUser
    while (true) {
const { data: repos } = await octokit.repos.listForAuthenticatedUser({
  per_page: perPage,
  page,
  sort: "updated",
  affiliation: "owner",  // sadece bu kalıyor
});
      allRepos = allRepos.concat(repos);
      if (repos.length < perPage) break;
      page++;
    }
  } else {
    // Başkasının profili → sadece public repolar
    while (true) {
      const { data: repos } = await octokit.repos.listForUser({
        username,
        type: "owner",
        per_page: perPage,
        page,
        sort: "updated",
      });
      allRepos = allRepos.concat(repos.map(r => ({ ...r, private: false })));
      if (repos.length < perPage) break;
      page++;
    }
  }

  // Fork olmayanları filtrele
  const ownRepos = allRepos.filter((r) => !r.fork);

  const BATCH_SIZE = 10;
  const repoInfos: RepoInfo[] = [];

  for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
    const batch = ownRepos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (repo, batchIdx) => {
        if (onProgress) {
          onProgress(i + batchIdx + 1, ownRepos.length, repo.name);
        }
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

        languagePercentages.sort((a, b) => b.value - a.value);

        // Fetch commits for advanced metrics
        let commitDates: string[] = [];
        let totalCommits = 0;
        let lastMaintenance: string | null = null;
        try {
          const { data: commits } = await octokit.repos.listCommits({
            owner: username,
            repo: repo.name,
            per_page: 100,
          });
          totalCommits = commits.length;
          
          const datesSet = new Set<string>();
          for (const c of commits) {
            const dateStr = c.commit.author?.date || c.commit.committer?.date;
            if (dateStr) {
              if (!lastMaintenance) lastMaintenance = dateStr;
              datesSet.add(dateStr.slice(0, 10)); // YYYY-MM-DD
              commitDates.push(dateStr);
            }
          }
          commitDates = Array.from(datesSet).sort();
        } catch (e) {
          // ignore error if repo is empty or commits cannot be fetched
        }

        const createdAt = repo.created_at ? new Date(repo.created_at).getTime() : Date.now();
        const updatedAt = repo.updated_at ? new Date(repo.updated_at).getTime() : Date.now();
        const totalDurationDays = Math.max(1, Math.round((updatedAt - createdAt) / (1000 * 60 * 60 * 24)));
        const activeDays = commitDates.length;
        const developmentDensity = totalDurationDays > 0 ? activeDays / totalDurationDays : 0;

        const advancedMetrics: RepoAdvancedMetrics = {
          activeDays,
          totalDurationDays,
          developmentDensity,
          commitDates,
          projectScore: 0, // Will be calculated after all repos are fetched
          totalCommits,
          lastMaintenance,
        };

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
          private: repo.private ?? false,
          advancedMetrics,
        } satisfies RepoInfo;
      })
    );
    repoInfos.push(...results);
  }

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
      value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
      bytes,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate normalization for Project Score
  const maxActiveDays = Math.max(...repoInfos.map((r) => r.advancedMetrics?.activeDays || 0), 1);
  const maxSize = Math.max(...repoInfos.map((r) => r.size), 1);
  const maxCommits = Math.max(...repoInfos.map((r) => r.advancedMetrics?.totalCommits || 0), 1);
  const now = Date.now();
  const maxRecency = Math.max(...repoInfos.map((r) => r.updated_at ? Math.max(0, 3650 - Math.floor((now - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24))) : 0), 1);

  for (const repo of repoInfos) {
    if (repo.advancedMetrics) {
      const densityScore = Math.min(1, repo.advancedMetrics.developmentDensity) * 100;
      const activeDaysScore = (repo.advancedMetrics.activeDays / maxActiveDays) * 100;
      const sizeScore = (repo.size / maxSize) * 100;
      
      const daysSinceUpdate = repo.updated_at ? Math.max(0, Math.floor((now - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24))) : 3650;
      const recencyValue = Math.max(0, 3650 - daysSinceUpdate);
      const recencyScore = (recencyValue / maxRecency) * 100;
      
      const commitsScore = (repo.advancedMetrics.totalCommits / maxCommits) * 100;

      // Project Score
      // 40% Development Density
      // 25% Total active days
      // 15% Code size
      // 10% Last update
      // 10% Commit count
      repo.advancedMetrics.projectScore = 
        (densityScore * 0.40) +
        (activeDaysScore * 0.25) +
        (sizeScore * 0.15) +
        (recencyScore * 0.10) +
        (commitsScore * 0.10);
    }
  }

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
  languages: Record<string, number>;
  languagePercentages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
}

export interface RepoCommitHistory {
  repoName: string;
  snapshots: CommitLanguageSnapshot[];
  allLanguages: string[];
}

export async function fetchRepoCommitHistory(
  owner: string,
  repo: string,
  token?: string,
  limit: number = 30
): Promise<RepoCommitHistory> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  const { data: commits } = await octokit.repos.listCommits({
    owner,
    repo,
    per_page: Math.min(limit, 50),
  });

  let selectedCommits = commits;
  if (commits.length > limit) {
    const step = Math.floor(commits.length / limit);
    selectedCommits = [];
    for (let i = 0; i < commits.length && selectedCommits.length < limit; i += step) {
      selectedCommits.push(commits[i]);
    }
    if (selectedCommits[selectedCommits.length - 1] !== commits[commits.length - 1]) {
      selectedCommits.push(commits[commits.length - 1]);
    }
  }

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
        message: commit.commit.message.split("\n")[0],
        languages: langMap,
        languagePercentages,
        totalBytes: total,
      });
    } catch {
      continue;
    }
  }

  snapshots.reverse();

  return {
    repoName: repo,
    snapshots,
    allLanguages: Array.from(allLangsSet),
  };
}

// --- Deep Single-Repo Analysis ---

export interface DeepContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface DeepRelease {
  tag: string;
  name: string | null;
  publishedAt: string;
  url: string;
}

export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface RepoDeepAnalysis {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  defaultBranch: string;
  license: string | null;
  topics: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  // headline metrics
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPRs: number;
  sizeKb: number;
  // languages
  languages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
  // contributors + bus factor
  contributors: DeepContributor[];
  contributorCount: number;
  busFactor: number; // # of contributors that together own >50% of commits
  busFactorPct: number; // their combined share (0-100)
  // commit activity (derived from recent commits)
  commitActivity: DayCount[];
  recentCommits: number; // commits in the analysed window
  windowDays: number;
  commitsByWeekday: number[]; // length 7, Sun..Sat
  commitsByHour: number[]; // length 24
  lastCommitDate: string | null;
  // releases
  releases: DeepRelease[];
  releaseCount: number;
  // hygiene
  hasReadme: boolean;
  hasCI: boolean;
}

function parseLastPage(linkHeader: string | undefined): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : null;
}

export async function fetchRepoDeepAnalysis(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoDeepAnalysis> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  const { data: r } = await octokit.repos.get({ owner, repo });

  // Run the independent calls in parallel; each guarded so one failure
  // doesn't sink the whole analysis.
  const [languages, contributorsResult, commits, releaseInfo, openPRs, hasReadme, hasCI] =
    await Promise.all([
      octokit.repos
        .listLanguages({ owner, repo })
        .then((res) => res.data)
        .catch(() => ({} as RepoLanguages)),
      octokit.repos
        .listContributors({ owner, repo, per_page: 100, anon: "0" })
        .then((res) => res.data)
        .catch(() => []),
      octokit.repos
        .listCommits({ owner, repo, per_page: 100 })
        .then((res) => res.data)
        .catch(() => []),
      octokit.repos
        .listReleases({ owner, repo, per_page: 100 })
        .then((res) => res.data)
        .catch(() => []),
      octokit.pulls
        .list({ owner, repo, state: "open", per_page: 1 })
        .then((res) => {
          const last = parseLastPage(res.headers.link);
          if (last != null) return last;
          return res.data.length;
        })
        .catch(() => 0),
      octokit.repos
        .getReadme({ owner, repo })
        .then(() => true)
        .catch(() => false),
      octokit.repos
        .getContent({ owner, repo, path: ".github/workflows" })
        .then((res) => Array.isArray(res.data) && res.data.length > 0)
        .catch(() => false),
    ]);

  // Languages → percentages
  const totalBytes = Object.values(languages).reduce((s, b) => s + b, 0);
  const languagePercentages = Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
      bytes,
    }))
    .sort((a, b) => b.value - a.value);

  // Contributors + bus factor
  const contributors: DeepContributor[] = contributorsResult
    .map((c) => ({
      login: c.login ?? "",
      avatar_url: c.avatar_url ?? "",
      html_url: c.html_url ?? "",
      contributions: c.contributions ?? 0,
    }))
    .filter((c) => c.login !== "")
    .sort((a, b) => b.contributions - a.contributions);

  const totalContributions = contributors.reduce(
    (s, c) => s + c.contributions,
    0
  );
  let busFactor = 0;
  let running = 0;
  for (const c of contributors) {
    running += c.contributions;
    busFactor++;
    if (totalContributions > 0 && running / totalContributions > 0.5) break;
  }
  const busFactorPct =
    totalContributions > 0
      ? Math.round((running / totalContributions) * 100)
      : 0;

  // Commit activity from the recent commit window
  const dayMap = new Map<string, number>();
  const commitsByWeekday = new Array(7).fill(0);
  const commitsByHour = new Array(24).fill(0);
  let oldestDate: number | null = null;
  let newestDate: number | null = null;

  for (const c of commits) {
    const iso = c.commit.author?.date || c.commit.committer?.date;
    if (!iso) continue;
    const d = new Date(iso);
    const ts = d.getTime();
    if (oldestDate === null || ts < oldestDate) oldestDate = ts;
    if (newestDate === null || ts > newestDate) newestDate = ts;
    const dayKey = iso.substring(0, 10);
    dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + 1);
    commitsByWeekday[d.getUTCDay()]++;
    commitsByHour[d.getUTCHours()]++;
  }

  const commitActivity: DayCount[] = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const windowDays =
    oldestDate !== null && newestDate !== null
      ? Math.max(
          1,
          Math.round((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
        )
      : 0;

  // Releases
  const releases: DeepRelease[] = releaseInfo
    .slice(0, 8)
    .map((rel) => ({
      tag: rel.tag_name,
      name: rel.name ?? null,
      publishedAt: rel.published_at ?? rel.created_at ?? "",
      url: rel.html_url,
    }));

  const openIssues = Math.max(0, (r.open_issues_count ?? 0) - openPRs);

  return {
    owner,
    repo,
    fullName: r.full_name,
    description: r.description,
    html_url: r.html_url,
    homepage: r.homepage || null,
    defaultBranch: r.default_branch,
    license: r.license?.name ?? null,
    topics: r.topics ?? [],
    isArchived: r.archived ?? false,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
    pushedAt: r.pushed_at ?? "",
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    watchers: r.subscribers_count ?? r.watchers_count ?? 0,
    openIssues,
    openPRs,
    sizeKb: r.size ?? 0,
    languages: languagePercentages,
    totalBytes,
    contributors: contributors.slice(0, 20),
    contributorCount: contributors.length,
    busFactor,
    busFactorPct,
    commitActivity,
    recentCommits: commits.length,
    windowDays,
    commitsByWeekday,
    commitsByHour,
    lastCommitDate: newestDate !== null ? new Date(newestDate).toISOString() : null,
    releases,
    releaseCount: releaseInfo.length,
    hasReadme,
    hasCI,
  };
}

// --- Organization Analysis ---

export interface OrgProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  description: string | null;
  public_repos: number;
  members_count?: number;
}

export interface OrgAnalysis {
  org: OrgProfile;
  repos: RepoInfo[];
  overallLanguages: { name: string; value: number; bytes: number }[];
  totalBytes: number;
  totalRepos: number;
}

export async function fetchOrgAnalysis(
  orgName: string,
  token?: string,
  onProgress?: (current: number, total: number, repoName: string) => void
): Promise<OrgAnalysis> {
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  const { data: orgData } = await octokit.orgs.get({ org: orgName });

  const org: OrgProfile = {
    login: orgData.login,
    name: orgData.name ?? null,
    avatar_url: orgData.avatar_url,
    html_url: orgData.html_url,
    description: orgData.description ?? null,
    public_repos: orgData.public_repos,
  };

  let page = 1;
  const perPage = 100;
  let allRepos: Awaited<ReturnType<typeof octokit.repos.listForOrg>>["data"] = [];

  while (true) {
    const { data: repos } = await octokit.repos.listForOrg({
      org: orgName,
      type: "public",
      per_page: perPage,
      page,
      sort: "updated",
    });
    allRepos = allRepos.concat(repos);
    if (repos.length < perPage) break;
    page++;
  }

  const ownRepos = allRepos.filter((r) => !r.fork);

  const BATCH_SIZE = 10;
  const repoInfos: RepoInfo[] = [];

  for (let i = 0; i < ownRepos.length; i += BATCH_SIZE) {
    const batch = ownRepos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (repo, batchIdx) => {
        if (onProgress) {
          onProgress(i + batchIdx + 1, ownRepos.length, repo.name);
        }
        const { data: languages } = await octokit.repos.listLanguages({
          owner: orgName,
          repo: repo.name,
        });

        const totalBytes = Object.values(languages).reduce((sum, b) => sum + b, 0);
        const languagePercentages = Object.entries(languages)
          .map(([name, bytes]) => ({
            name,
            value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
            bytes,
          }))
          .sort((a, b) => b.value - a.value);

        // Fetch commits for advanced metrics
        let commitDates: string[] = [];
        let totalCommits = 0;
        let lastMaintenance: string | null = null;
        try {
          const { data: commits } = await octokit.repos.listCommits({
            owner: orgName,
            repo: repo.name,
            per_page: 100,
          });
          totalCommits = commits.length;
          
          const datesSet = new Set<string>();
          for (const c of commits) {
            const dateStr = c.commit.author?.date || c.commit.committer?.date;
            if (dateStr) {
              if (!lastMaintenance) lastMaintenance = dateStr;
              datesSet.add(dateStr.slice(0, 10)); // YYYY-MM-DD
              commitDates.push(dateStr);
            }
          }
          commitDates = Array.from(datesSet).sort();
        } catch (e) {
          // ignore error if repo is empty or commits cannot be fetched
        }

        const createdAt = repo.created_at ? new Date(repo.created_at).getTime() : Date.now();
        const updatedAt = repo.updated_at ? new Date(repo.updated_at).getTime() : Date.now();
        const totalDurationDays = Math.max(1, Math.round((updatedAt - createdAt) / (1000 * 60 * 60 * 24)));
        const activeDays = commitDates.length;
        const developmentDensity = totalDurationDays > 0 ? activeDays / totalDurationDays : 0;

        const advancedMetrics: RepoAdvancedMetrics = {
          activeDays,
          totalDurationDays,
          developmentDensity,
          commitDates,
          projectScore: 0, // Will be calculated after all repos are fetched
          totalCommits,
          lastMaintenance,
        };

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
          private: false,
          advancedMetrics,
        } satisfies RepoInfo;
      })
    );
    repoInfos.push(...results);
  }

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
      value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 10000) / 100 : 0,
      bytes,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate normalization for Project Score
  const maxActiveDays = Math.max(...repoInfos.map((r) => r.advancedMetrics?.activeDays || 0), 1);
  const maxSize = Math.max(...repoInfos.map((r) => r.size), 1);
  const maxCommits = Math.max(...repoInfos.map((r) => r.advancedMetrics?.totalCommits || 0), 1);
  const now = Date.now();
  const maxRecency = Math.max(...repoInfos.map((r) => r.updated_at ? Math.max(0, 3650 - Math.floor((now - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24))) : 0), 1);

  for (const repo of repoInfos) {
    if (repo.advancedMetrics) {
      const densityScore = Math.min(1, repo.advancedMetrics.developmentDensity) * 100;
      const activeDaysScore = (repo.advancedMetrics.activeDays / maxActiveDays) * 100;
      const sizeScore = (repo.size / maxSize) * 100;
      
      const daysSinceUpdate = repo.updated_at ? Math.max(0, Math.floor((now - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24))) : 3650;
      const recencyValue = Math.max(0, 3650 - daysSinceUpdate);
      const recencyScore = (recencyValue / maxRecency) * 100;
      
      const commitsScore = (repo.advancedMetrics.totalCommits / maxCommits) * 100;

      repo.advancedMetrics.projectScore = 
        (densityScore * 0.40) +
        (activeDaysScore * 0.25) +
        (sizeScore * 0.15) +
        (recencyScore * 0.10) +
        (commitsScore * 0.10);
    }
  }

  return {
    org,
    repos: repoInfos,
    overallLanguages,
    totalBytes,
    totalRepos: repoInfos.length,
  };
}