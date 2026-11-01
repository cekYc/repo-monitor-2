import type {
  DailyActivityEntry,
  RepoActivitySummary,
  RepoInfo,
  UserAnalysis,
  UserDailyActivityResponse,
} from "@/lib/github";

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
    userContribution: {
      contributedBytes: totalBytes,
      contributedLines: Math.round(totalBytes / 45),
      commits: seed.commits,
      ratio: 1,
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

export function buildSampleDailyActivity(): UserDailyActivityResponse {
  const days: DailyActivityEntry[] = [
    {
      date: "2026-10-12",
      reposCreated: [],
      repoCommits: [
        {
          repoName: "kubernetes",
          fullName: "kubernetes/kubernetes",
          ownerLogin: "kubernetes",
          ownerAvatar: "https://avatars.githubusercontent.com/u/13629408?s=200&v=4",
          htmlUrl: "https://github.com/kubernetes/kubernetes",
          isContributed: true,
          private: false,
          primaryLanguage: "Go",
          totalRepoBytes: 85_600_000,
          commitCount: 3,
          additions: 412,
          deletions: 86,
          linesKnown: true,
          commits: [
            {
              sha: "8f3c2a19d4e7b6a1234567890abcdef123456789",
              shortSha: "8f3c2a1",
              message: "scheduler: optimize node affinity scoring allocation",
              timestamp: "2026-10-12T16:42:00Z",
              url: "https://github.com/kubernetes/kubernetes/commit/8f3c2a1",
              additions: 210,
              deletions: 48,
            },
            {
              sha: "4b9e1d02c3f8a7b6543210fedcba9876543210fe",
              shortSha: "4b9e1d0",
              message: "test: add unit benchmarks for pod topology spread",
              timestamp: "2026-10-12T13:18:00Z",
              url: "https://github.com/kubernetes/kubernetes/commit/4b9e1d0",
              additions: 154,
              deletions: 12,
            },
            {
              sha: "1c7a5e88b2d4f0a9876543210abcdef987654321",
              shortSha: "1c7a5e8",
              message: "cleanup: remove deprecated scheduler predicate helpers",
              timestamp: "2026-10-12T10:05:00Z",
              url: "https://github.com/kubernetes/kubernetes/commit/1c7a5e8",
              additions: 48,
              deletions: 26,
            },
          ],
        },
      ],
      totalCommits: 3,
      totalAdditions: 412,
      totalDeletions: 86,
    },
    {
      date: "2026-09-12",
      reposCreated: [],
      repoCommits: [
        {
          repoName: "atlas-ui",
          fullName: "octo-sample/atlas-ui",
          ownerLogin: "octo-sample",
          htmlUrl: "https://github.com/octo-sample/atlas-ui",
          isContributed: false,
          private: false,
          primaryLanguage: "TypeScript",
          totalRepoBytes: 599_000,
          commitCount: 4,
          additions: 640,
          deletions: 125,
          linesKnown: true,
          commits: [
            {
              sha: "a12bc34def5678901234567890abcdef12345678",
              shortSha: "a12bc34",
              message: "feat(table): add virtualized row rendering and keyboard navigation",
              timestamp: "2026-09-12T16:40:00Z",
              url: "https://github.com/octo-sample/atlas-ui/commit/a12bc34",
              additions: 340,
              deletions: 45,
            },
            {
              sha: "b23cd45efa6789012345678901abcdef23456789",
              shortSha: "b23cd45",
              message: "feat(tokens): introduce high-contrast dark surface tokens",
              timestamp: "2026-09-12T14:15:00Z",
              url: "https://github.com/octo-sample/atlas-ui/commit/b23cd45",
              additions: 180,
              deletions: 30,
            },
            {
              sha: "c34de56fab7890123456789012abcdef34567890",
              shortSha: "c34de56",
              message: "refactor(popover): simplify focus trap lifecycle",
              timestamp: "2026-09-12T11:20:00Z",
              url: "https://github.com/octo-sample/atlas-ui/commit/c34de56",
              additions: 65,
              deletions: 40,
            },
            {
              sha: "d45ef67abc8901234567890123abcdef45678901",
              shortSha: "d45ef67",
              message: "docs(mdx): document data-grid column pinning API",
              timestamp: "2026-09-12T09:10:00Z",
              url: "https://github.com/octo-sample/atlas-ui/commit/d45ef67",
              additions: 55,
              deletions: 10,
            },
          ],
        },
        {
          repoName: "rust-diffs",
          fullName: "octo-sample/rust-diffs",
          ownerLogin: "octo-sample",
          htmlUrl: "https://github.com/octo-sample/rust-diffs",
          isContributed: false,
          private: false,
          primaryLanguage: "Rust",
          totalRepoBytes: 270_400,
          commitCount: 2,
          additions: 195,
          deletions: 68,
          linesKnown: true,
          commits: [
            {
              sha: "e56fa78bcd9012345678901234abcdef56789012",
              shortSha: "e56fa78",
              message: "perf(arena): reuse token buffers across syntax tree passes",
              timestamp: "2026-09-12T18:05:00Z",
              url: "https://github.com/octo-sample/rust-diffs/commit/e56fa78",
              additions: 145,
              deletions: 52,
            },
            {
              sha: "f67ab89cde0123456789012345abcdef67890123",
              shortSha: "f67ab89",
              message: "fix(cli): handle non-utf8 binary blobs gracefully",
              timestamp: "2026-09-12T17:12:00Z",
              url: "https://github.com/octo-sample/rust-diffs/commit/f67ab89",
              additions: 50,
              deletions: 16,
            },
          ],
        },
      ],
      totalCommits: 6,
      totalAdditions: 835,
      totalDeletions: 193,
    },
    {
      date: "2025-06-23",
      reposCreated: [
        {
          repoName: "svelte-gauge",
          fullName: "octo-sample/svelte-gauge",
          htmlUrl: "https://github.com/octo-sample/svelte-gauge",
          description: "Tiny animated gauge component.",
          createdAt: "2025-06-23T12:00:00Z",
          private: false,
          primaryLanguage: "Svelte",
          totalBytes: 66_200,
          stars: 88,
        },
      ],
      repoCommits: [
        {
          repoName: "svelte-gauge",
          fullName: "octo-sample/svelte-gauge",
          ownerLogin: "octo-sample",
          htmlUrl: "https://github.com/octo-sample/svelte-gauge",
          isContributed: false,
          private: false,
          primaryLanguage: "Svelte",
          totalRepoBytes: 66_200,
          commitCount: 3,
          additions: 520,
          deletions: 15,
          linesKnown: true,
          commits: [
            {
              sha: "91827364554637281910abcdef1234567890abcd",
              shortSha: "9182736",
              message: "feat: initial SVG arc gauge with spring physics",
              timestamp: "2025-06-23T12:15:00Z",
              url: "https://github.com/octo-sample/svelte-gauge/commit/9182736",
              additions: 410,
              deletions: 0,
            },
            {
              sha: "827364554637281910abcdef1234567890abcdef",
              shortSha: "8273645",
              message: "feat: custom color stops and tick marks",
              timestamp: "2025-06-23T15:40:00Z",
              url: "https://github.com/octo-sample/svelte-gauge/commit/8273645",
              additions: 110,
              deletions: 15,
            },
          ],
        },
      ],
      totalCommits: 3,
      totalAdditions: 520,
      totalDeletions: 15,
    },
    {
      date: "2024-02-11",
      reposCreated: [
        {
          repoName: "atlas-ui",
          fullName: "octo-sample/atlas-ui",
          htmlUrl: "https://github.com/octo-sample/atlas-ui",
          description: "Design system and component library for internal dashboards.",
          createdAt: "2024-02-11T09:12:00Z",
          private: false,
          primaryLanguage: "TypeScript",
          totalBytes: 599_000,
          stars: 412,
        },
      ],
      repoCommits: [
        {
          repoName: "atlas-ui",
          fullName: "octo-sample/atlas-ui",
          ownerLogin: "octo-sample",
          htmlUrl: "https://github.com/octo-sample/atlas-ui",
          isContributed: false,
          private: false,
          primaryLanguage: "TypeScript",
          totalRepoBytes: 599_000,
          commitCount: 2,
          additions: 890,
          deletions: 0,
          linesKnown: true,
          commits: [
            {
              sha: "7766554433221100ffeeddccbbaa998877665544",
              shortSha: "7766554",
              message: "chore: bootstrap monorepo and design token pipeline",
              timestamp: "2024-02-11T09:20:00Z",
              url: "https://github.com/octo-sample/atlas-ui/commit/7766554",
              additions: 890,
              deletions: 0,
            },
          ],
        },
      ],
      totalCommits: 2,
      totalAdditions: 890,
      totalDeletions: 0,
    },
  ];

  const repoSummaries: RepoActivitySummary[] = SEEDS.map((s) => {
    const totalBytes = Object.values(s.languages).reduce((a, b) => a + b, 0);
    const primaryLanguage = Object.entries(s.languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const sampleDays = days
      .flatMap((d) => d.repoCommits)
      .filter((rc) => rc.fullName === `octo-sample/${s.name}`);
    return {
      repoName: s.name,
      fullName: `octo-sample/${s.name}`,
      htmlUrl: `https://github.com/octo-sample/${s.name}`,
      isContributed: false,
      private: false,
      primaryLanguage,
      createdAt: s.created,
      firstCommitDate: s.created.slice(0, 10),
      lastCommitDate: s.pushed.slice(0, 10),
      activeDays: s.activeDays,
      totalCommits: s.commits,
      totalAdditions: sampleDays.reduce((acc, rc) => acc + rc.additions, 0),
      totalDeletions: sampleDays.reduce((acc, rc) => acc + rc.deletions, 0),
      linesCommits: sampleDays.reduce((acc, rc) => acc + rc.commitCount, 0),
      currentRepoBytes: totalBytes,
    };
  });

  return {
    username: "octo-sample",
    days,
    repoSummaries,
    totals: {
      activeDays: days.length,
      reposCreated: SEEDS.length,
      totalCommits: SEEDS.reduce((acc, s) => acc + s.commits, 0),
      totalAdditions: repoSummaries.reduce((acc, r) => acc + r.totalAdditions, 0),
      totalDeletions: repoSummaries.reduce((acc, r) => acc + r.totalDeletions, 0),
      linesCommits: repoSummaries.reduce((acc, r) => acc + r.linesCommits, 0),
    },
    source: "sample",
  };
}

