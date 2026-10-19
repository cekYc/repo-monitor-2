import type { RepoInfo, UserAnalysis } from "@/lib/github";

/** Sample analysis used for the very first visit.
 *
 *  The opening screen must show the real layout, not a form: this fills every
 *  module with plausible, self-consistent numbers and costs zero API quota.
 *  All dates are fixed so server and client render identically.
 *
 *  Never presented as real data — the Analyze screen marks it as a sample and
 *  offers exactly one action. */

interface RepoSeed {
  name: string;
  description: string;
  stars: number;
  forks: number;
  languages: Record<string, number>;
  created: string;
  pushed: string;
  commits: number;
  commitsLastMonth: number;
  activeDays: number;
  score: number;
}

const SEEDS: RepoSeed[] = [
  {
    name: "atlas-ui",
    description: "Design system and component library for internal dashboards.",
    stars: 412,
    forks: 38,
    languages: { TypeScript: 486_000, CSS: 91_000, MDX: 22_000 },
    created: "2024-02-11T09:12:00Z",
    pushed: "2026-09-12T16:40:00Z",
    commits: 1284,
    commitsLastMonth: 46,
    activeDays: 310,
    score: 88,
  },
  {
    name: "pulse-collector",
    description: "Metrics collector that ships repository events to ClickHouse.",
    stars: 197,
    forks: 21,
    languages: { Go: 342_000, Dockerfile: 4_100, Makefile: 2_300 },
    created: "2023-08-04T11:30:00Z",
    pushed: "2026-08-29T08:05:00Z",
    commits: 863,
    commitsLastMonth: 18,
    activeDays: 224,
    score: 79,
  },
  {
    name: "notebook-lab",
    description: "Experiments on commit-cadence modelling.",
    stars: 64,
    forks: 9,
    languages: { "Jupyter Notebook": 210_000, Python: 78_000 },
    created: "2025-01-19T14:02:00Z",
    pushed: "2026-07-03T10:22:00Z",
    commits: 241,
    commitsLastMonth: 0,
    activeDays: 96,
    score: 58,
  },
  {
    name: "rust-diffs",
    description: "Fast structural diffing for language statistics.",
    stars: 158,
    forks: 12,
    languages: { Rust: 264_000, Shell: 6_400 },
    created: "2024-11-02T07:44:00Z",
    pushed: "2026-09-05T19:17:00Z",
    commits: 512,
    commitsLastMonth: 27,
    activeDays: 141,
    score: 74,
  },
  {
    name: "svelte-gauge",
    description: "Tiny animated gauge component.",
    stars: 88,
    forks: 6,
    languages: { Svelte: 41_000, TypeScript: 18_000, CSS: 7_200 },
    created: "2025-06-23T12:00:00Z",
    pushed: "2026-05-28T09:31:00Z",
    commits: 137,
    commitsLastMonth: 0,
    activeDays: 44,
    score: 49,
  },
  {
    name: "infra-notes",
    description: "Runbooks and terraform modules.",
    stars: 23,
    forks: 3,
    languages: { HCL: 52_000, Markdown: 31_000, Shell: 9_800 },
    created: "2023-03-15T08:20:00Z",
    pushed: "2026-02-14T15:48:00Z",
    commits: 309,
    commitsLastMonth: 0,
    activeDays: 118,
    score: 44,
  },
];

function buildRepo(seed: RepoSeed): RepoInfo {
  const totalBytes = Object.values(seed.languages).reduce((a, b) => a + b, 0);
  const languagePercentages = Object.entries(seed.languages)
    .map(([name, bytes]) => ({
      name,
      value: Math.round((bytes / totalBytes) * 10000) / 100,
      bytes,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const totalDurationDays = Math.max(
    1,
    Math.round(
      (new Date(seed.pushed).getTime() - new Date(seed.created).getTime()) / 86_400_000
    )
  );

  return {
    name: seed.name,
    description: seed.description,
    html_url: `https://github.com/octo-sample/${seed.name}`,
    stargazers_count: seed.stars,
    forks_count: seed.forks,
    size: Math.round(totalBytes / 1024),
    created_at: seed.created,
    updated_at: seed.pushed,
    pushed_at: seed.pushed,
    languages: seed.languages,
    languagePercentages,
    totalBytes,
    private: false,
    advancedMetrics: {
      activeDays: seed.activeDays,
      totalDurationDays,
      developmentDensity: Math.round((seed.activeDays / totalDurationDays) * 100) / 100,
      commitDates: [],
      projectScore: seed.score,
      totalCommits: seed.commits,
      commitsLastMonth: seed.commitsLastMonth,
      lastMaintenance: seed.pushed,
    },
  };
}

export function buildSampleAnalysis(): UserAnalysis {
  const repos = SEEDS.map(buildRepo);

  const langBytes: Record<string, number> = {};
  let totalBytes = 0;
  for (const repo of repos) {
    for (const [lang, bytes] of Object.entries(repo.languages)) {
      langBytes[lang] = (langBytes[lang] ?? 0) + bytes;
      totalBytes += bytes;
    }
  }

  const overallLanguages = Object.entries(langBytes)
    .map(([name, bytes]) => ({
      name,
      value: Math.round((bytes / totalBytes) * 10000) / 100,
      bytes,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    user: {
      login: "octo-sample",
      name: "Sample Developer",
      avatar_url: "",
      html_url: "https://github.com/",
      bio: "Placeholder profile — search for a real GitHub user to replace it.",
      public_repos: repos.length,
      followers: 1_248,
      following: 96,
    },
    repos,
    overallLanguages,
    totalBytes,
    totalRepos: repos.length,
    analysisScope: "public",
  };
}

export function buildSampleContributedRepos(): RepoInfo[] {
  return [
    {
      name: "kubernetes",
      fullName: "kubernetes/kubernetes",
      ownerLogin: "kubernetes",
      ownerAvatar: "https://avatars.githubusercontent.com/u/13629408?s=200&v=4",
      description: "Production-Grade Container Scheduling and Management",
      html_url: "https://github.com/kubernetes/kubernetes",
      stargazers_count: 112500,
      forks_count: 39400,
      size: 154000,
      created_at: "2014-06-06T22:56:04Z",
      updated_at: "2026-10-18T10:00:00Z",
      pushed_at: "2026-10-18T12:00:00Z",
      languages: { Go: 82000000, Shell: 2400000, Python: 1200000 },
      languagePercentages: [
        { name: "Go", value: 95.8, bytes: 82000000 },
        { name: "Shell", value: 2.8, bytes: 2400000 },
        { name: "Python", value: 1.4, bytes: 1200000 },
      ],
      totalBytes: 85600000,
      private: false,
      isContributed: true,
      advancedMetrics: {
        activeDays: 14,
        totalDurationDays: 180,
        developmentDensity: 0.08,
        commitDates: ["2026-08-10", "2026-09-04", "2026-10-12"],
        projectScore: 94,
        totalCommits: 8,
        commitsLastMonth: 2,
        lastMaintenance: "2026-10-12T14:20:00Z",
      },
      userContribution: {
        contributedBytes: 1_840_000,
        contributedLines: 41200,
        commits: 8,
        ratio: 0.0215,
      },
    },
    {
      name: "next.js",
      fullName: "vercel/next.js",
      ownerLogin: "vercel",
      ownerAvatar: "https://avatars.githubusercontent.com/u/14985020?s=200&v=4",
      description: "The React Framework for the Web",
      html_url: "https://github.com/vercel/next.js",
      stargazers_count: 129000,
      forks_count: 27500,
      size: 98000,
      created_at: "2016-10-05T23:32:51Z",
      updated_at: "2026-10-18T11:30:00Z",
      pushed_at: "2026-10-18T13:45:00Z",
      languages: { JavaScript: 45000000, TypeScript: 42000000, Rust: 12000000 },
      languagePercentages: [
        { name: "JavaScript", value: 45.4, bytes: 45000000 },
        { name: "TypeScript", value: 42.4, bytes: 42000000 },
        { name: "Rust", value: 12.1, bytes: 12000000 },
      ],
      totalBytes: 99000000,
      private: false,
      isContributed: true,
      advancedMetrics: {
        activeDays: 9,
        totalDurationDays: 120,
        developmentDensity: 0.075,
        commitDates: ["2026-07-22", "2026-09-15"],
        projectScore: 92,
        totalCommits: 4,
        commitsLastMonth: 1,
        lastMaintenance: "2026-09-15T09:12:00Z",
      },
      userContribution: {
        contributedBytes: 340_000,
        contributedLines: 7800,
        commits: 4,
        ratio: 0.0034,
      },
    },
    {
      name: "tailwindcss",
      fullName: "tailwindlabs/tailwindcss",
      ownerLogin: "tailwindlabs",
      ownerAvatar: "https://avatars.githubusercontent.com/u/67104409?s=200&v=4",
      description: "A utility-first CSS framework for rapid UI development.",
      html_url: "https://github.com/tailwindlabs/tailwindcss",
      stargazers_count: 84000,
      forks_count: 4200,
      size: 45000,
      created_at: "2017-11-01T12:00:00Z",
      updated_at: "2026-10-17T18:00:00Z",
      pushed_at: "2026-10-17T19:00:00Z",
      languages: { TypeScript: 15000000, CSS: 5000000, Rust: 4000000 },
      languagePercentages: [
        { name: "TypeScript", value: 62.5, bytes: 15000000 },
        { name: "CSS", value: 20.8, bytes: 5000000 },
        { name: "Rust", value: 16.7, bytes: 4000000 },
      ],
      totalBytes: 24000000,
      private: false,
      isContributed: true,
      advancedMetrics: {
        activeDays: 6,
        totalDurationDays: 90,
        developmentDensity: 0.067,
        commitDates: ["2026-08-01", "2026-10-05"],
        projectScore: 88,
        totalCommits: 3,
        commitsLastMonth: 1,
        lastMaintenance: "2026-10-05T16:30:00Z",
      },
      userContribution: {
        contributedBytes: 174_080,
        contributedLines: 3850,
        commits: 3,
        ratio: 0.0072,
      },
    },
  ];
}

