import type { UserAnalysis } from "@/lib/github";
import { getDevelopmentSpanDays } from "@/lib/repo-activity";

export type TechnicalDomain = "systems" | "web" | "data" | "other";

export interface DeveloperCharacteristics {
  breadth: {
    score: number;
    effectiveLanguages: number;
    languageCount: number;
    ecosystemDiversity: number;
    domainDistribution: Record<TechnicalDomain, number>;
  };
  depth: {
    score: number;
    codePerRepo: number;
    activeDevelopmentDays: number;
    commitSpanDays: number;
    longTermRevisitRate: number;
    historyCoverage: number;
  };
  community: {
    score: number;
    starsPerRepo: number;
    forksPerRepo: number;
    followers: number;
    externalAdoptionRate: number;
  };
  focus: {
    score: number;
    top1Share: number;
    top3Share: number;
    topLanguages: { name: string; value: number }[];
  };
}

const WEB_LANGUAGES = new Set([
  "astro", "blade", "css", "ejs", "elm", "haml", "handlebars", "html",
  "javascript", "less", "mdx", "php", "pug", "rescript", "ruby", "sass",
  "scss", "svelte", "typescript", "vue",
]);

const DATA_LANGUAGES = new Set([
  "julia", "jupyter notebook", "mathematica", "matlab", "plpgsql", "python",
  "r", "sas", "scala", "sql", "tsql",
]);

const SYSTEMS_LANGUAGES = new Set([
  "assembly", "c", "c#", "c++", "cmake", "cuda", "d", "dart", "dockerfile",
  "f#", "fortran", "go", "java", "kotlin", "makefile", "nim", "objective-c",
  "objective-c++", "powershell", "rust", "shell", "solidity", "swift", "v",
  "visual basic .net", "webassembly", "zig",
]);

const ECOSYSTEM_GROUPS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(["javascript", "typescript", "html", "css", "scss", "sass", "less", "vue", "svelte", "astro", "mdx"]),
  new Set(["java", "kotlin", "scala", "clojure", "groovy"]),
  new Set(["c#", "f#", "visual basic .net"]),
  new Set(["c", "c++", "rust", "zig", "assembly", "cmake", "makefile", "cuda"]),
  new Set(["python", "jupyter notebook"]),
  new Set(["r", "julia", "matlab", "mathematica", "sas", "sql", "plpgsql", "tsql"]),
  new Set(["swift", "objective-c", "objective-c++", "dart"]),
  new Set(["go", "ruby", "php", "elixir", "erlang"]),
  new Set(["shell", "powershell", "dockerfile"]),
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  return values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function logScore(value: number, reference: number): number {
  if (value <= 0) return 0;
  return clamp((Math.log1p(value) / Math.log1p(reference)) * 100);
}

function normalizeLanguage(name: string): string {
  return name.trim().toLowerCase();
}

function getTechnicalDomain(language: string): TechnicalDomain {
  const normalized = normalizeLanguage(language);
  if (WEB_LANGUAGES.has(normalized)) return "web";
  if (DATA_LANGUAGES.has(normalized)) return "data";
  if (SYSTEMS_LANGUAGES.has(normalized)) return "systems";
  return "other";
}

function getEcosystemIndex(language: string): number {
  const normalized = normalizeLanguage(language);
  return ECOSYSTEM_GROUPS.findIndex((group) => group.has(normalized));
}

function normalizedEntropy(shares: number[], maximumGroups: number): number {
  const positive = shares.filter((share) => share > 0);
  if (positive.length <= 1) return 0;
  const total = positive.reduce((sum, share) => sum + share, 0);
  const entropy = -positive.reduce((sum, share) => {
    const probability = share / total;
    return sum + probability * Math.log(probability);
  }, 0);
  return clamp((entropy / Math.log(maximumGroups)) * 100);
}

function effectiveLanguageCount(analysis: UserAnalysis): number {
  const shares = analysis.overallLanguages
    .map((language) => language.value / 100)
    .filter((share) => share > 0);
  if (shares.length === 0) return 0;
  const entropy = -shares.reduce(
    (sum, share) => sum + share * Math.log(share),
    0
  );
  return Math.exp(entropy);
}

function daysBetween(first: string, last: string): number {
  const firstTime = Date.parse(first);
  const lastTime = Date.parse(last);
  if (!Number.isFinite(firstTime) || !Number.isFinite(lastTime)) return 0;
  return Math.max(0, Math.round((lastTime - firstTime) / 86_400_000));
}

export function calculateDeveloperCharacteristics(
  analysis: UserAnalysis
): DeveloperCharacteristics {
  const repoCount = Math.max(analysis.repos.length, 1);
  const effectiveLanguages = effectiveLanguageCount(analysis);

  const domainDistribution: Record<TechnicalDomain, number> = {
    systems: 0,
    web: 0,
    data: 0,
    other: 0,
  };
  const ecosystemShares = new Map<number, number>();

  for (const language of analysis.overallLanguages) {
    const domain = getTechnicalDomain(language.name);
    domainDistribution[domain] += language.value;
    const ecosystemIndex = getEcosystemIndex(language.name);
    if (ecosystemIndex >= 0) {
      ecosystemShares.set(
        ecosystemIndex,
        (ecosystemShares.get(ecosystemIndex) ?? 0) + language.value
      );
    }
  }

  const ecosystemDiversity = [...ecosystemShares.values()].filter(
    (share) => share >= 3
  ).length;
  const activeDomains = (["systems", "web", "data"] as const).filter(
    (domain) => domainDistribution[domain] >= 5
  ).length;
  const languageBreadthScore = clamp(((effectiveLanguages - 1) / 7) * 100);
  const ecosystemBreadthScore = clamp(((ecosystemDiversity - 1) / 5) * 100);
  const domainBalanceScore =
    activeDomains === 0
      ? 0
      : activeDomains / 3 * 60 +
        normalizedEntropy(
          [domainDistribution.systems, domainDistribution.web, domainDistribution.data],
          3
        ) * 0.4;
  const breadthScore = Math.round(
    languageBreadthScore * 0.45 +
    ecosystemBreadthScore * 0.3 +
    domainBalanceScore * 0.25
  );

  const codePerRepo = analysis.totalBytes / repoCount;
  const activeDevelopmentDays = average(
    analysis.repos.map(getDevelopmentSpanDays)
  );
  const historyRepos = analysis.repos
    .map((repo) => repo.advancedMetrics?.commitDates ?? [])
    .filter((dates) => dates.length >= 2);
  const commitSpans = historyRepos.map((dates) =>
    daysBetween(dates[0], dates[dates.length - 1])
  );
  const commitSpanDays = average(commitSpans);
  const revisitedRepos = historyRepos.filter((dates, index) => {
    const distinctMonths = new Set(dates.map((date) => date.slice(0, 7))).size;
    return commitSpans[index] >= 180 && distinctMonths >= 3;
  }).length;
  const longTermRevisitRate = historyRepos.length > 0
    ? revisitedRepos / historyRepos.length * 100
    : 0;
  const historyCoverage = analysis.repos.length > 0
    ? historyRepos.length / analysis.repos.length * 100
    : 0;
  const depthScore = Math.round(
    logScore(codePerRepo, 5 * 1024 * 1024) * 0.25 +
    clamp(activeDevelopmentDays / 730 * 100) * 0.25 +
    clamp(commitSpanDays / 365 * 100) * 0.25 +
    longTermRevisitRate * 0.25
  );

  const stars = analysis.repos.reduce(
    (sum, repo) => sum + repo.stargazers_count,
    0
  );
  const forks = analysis.repos.reduce(
    (sum, repo) => sum + repo.forks_count,
    0
  );
  const starsPerRepo = stars / repoCount;
  const forksPerRepo = forks / repoCount;
  const adoptedRepos = analysis.repos.filter(
    (repo) => repo.stargazers_count > 0 || repo.forks_count > 0
  ).length;
  const externalAdoptionRate = analysis.repos.length > 0
    ? adoptedRepos / analysis.repos.length * 100
    : 0;
  const communityScore = Math.round(
    logScore(starsPerRepo, 50) * 0.3 +
    logScore(forksPerRepo, 10) * 0.2 +
    logScore(analysis.user.followers, 1000) * 0.25 +
    externalAdoptionRate * 0.25
  );

  const topLanguages = analysis.overallLanguages.slice(0, 3).map((language) => ({
    name: language.name,
    value: language.value,
  }));
  const top1Share = clamp(topLanguages[0]?.value ?? 0);
  const top3Share = clamp(topLanguages.reduce(
    (sum, language) => sum + language.value,
    0
  ));

  return {
    breadth: {
      score: breadthScore,
      effectiveLanguages,
      languageCount: analysis.overallLanguages.length,
      ecosystemDiversity,
      domainDistribution,
    },
    depth: {
      score: depthScore,
      codePerRepo,
      activeDevelopmentDays,
      commitSpanDays,
      longTermRevisitRate,
      historyCoverage,
    },
    community: {
      score: communityScore,
      starsPerRepo,
      forksPerRepo,
      followers: analysis.user.followers,
      externalAdoptionRate,
    },
    focus: {
      score: Math.round(top3Share),
      top1Share,
      top3Share,
      topLanguages,
    },
  };
}
