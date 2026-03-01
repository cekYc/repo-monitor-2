<div align="center">

# Repo Monitor

**Visualize the language DNA of any GitHub profile.**

Analyze any GitHub user's public (non-fork) repositories and get a complete breakdown of their programming language usage — per repo and across all projects — with interactive charts and detailed statistics.

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-ceky--repo--monitor.vercel.app-black?style=for-the-badge&logo=vercel)](https://ceky-repo-monitor.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-8884d8)
![License](https://img.shields.io/badge/License-MIT-green)

🇹🇷 [Türkçe dokümantasyon](README.tr.md)

### Language Badge (powered by Repo Monitor)

![cekYc Languages](https://ceky-repo-monitor.vercel.app/api/badge/cekYc)

> Add your own badge: `![Languages](https://ceky-repo-monitor.vercel.app/api/badge/YOUR_USERNAME)`

</div>

---

## The Problem

GitHub profiles show a tiny language bar, but it doesn't tell you much. If you want to understand how a developer actually spends their time — which languages dominate their work, how their stack is distributed across projects, or how large each project is — you're left clicking through repos one by one.

**Repo Monitor** solves this by pulling all non-fork public repos for any user and generating a full language analysis with interactive visualizations, all in one view.

## Features

### Core Analysis
- **Profile Overview** — Avatar, bio, follower count, total codebase size
- **Overall Language Distribution** — Aggregated across all repos (Pie Chart + Bar Chart + Table)
- **Per-Repo Breakdown** — Language bar, percentages, size, dates for each repository
- **Expandable Detail View** — Click any repo card for a mini pie chart + full language table
- **Commit History Timeline** — Stacked area chart showing language usage over time per repo
- **12 Insight Metrics** — Dominant language, average repo size, most active repo, and more

### Search & Navigation
- **URL Sharing** — `ceky-repo-monitor.vercel.app/?user=cekYc` → auto-analyze
- **Recent Searches** — Last 8 searches saved as clickable chips
- **Sort & Filter** — Filter by language, sort by update date / stars / size / language count / name
- **Fork Exclusion** — Only analyzes repositories the user authored

### Comparison & Export
- **User Comparison** — Compare two users side-by-side with head-to-head metric bars, winner badges, and grouped bar chart
- **Export Profile as PNG** — Download the profile card + charts as a high-res image
- **Export Repo Cards as PNG** — Select one or more repos and export them as a single image
- **Export Comparison as PNG** — Download the full comparison view

### Visualization
- **Contribution Heatmap** — GitHub-style 365-day contribution calendar (full data with token via GraphQL API, ~90 days without)
- **Embeddable Badge Generator** — SVG language badge for your GitHub README with Markdown/HTML copy
- **Language-Based Suggestions** — "You love TypeScript — check these trending repos" powered by GitHub Search

### Organization & PWA
- **Organization Analysis** — Analyze any GitHub org's public repos with language distribution
- **PWA Support** — Install as a native app, offline-capable with service worker
- **Rate Limit Badge** — Live API rate limit countdown with color-coded warnings

### UX
- **Dark / Light Mode** — Toggle between themes instantly
- **English / Turkish (i18n)** — Full bilingual support with 200+ translation keys
- **Real-time Progress** — SSE streaming shows which repo is being analyzed
- **Client-Side Caching** — Results cached for 30 minutes
- **No Token Required** — Works without authentication (60 req/hr); add a token for 5,000 req/hr
- **Token Persistence** — Token is saved in localStorage

## Tech Stack

| Technology | Role |
|---|---|
| [**Next.js 16**](https://nextjs.org/) (App Router, Turbopack) | Framework, SSE streaming, API routes |
| [**TypeScript 5**](https://www.typescriptlang.org/) | Type safety |
| [**Tailwind CSS 4**](https://tailwindcss.com/) | Utility-first styling |
| [**Recharts**](https://recharts.org/) | Pie charts, bar charts, area charts |
| [**Octokit**](https://github.com/octokit/rest.js) | GitHub REST API client |
| [**html-to-image**](https://github.com/bubkoo/html-to-image) | PNG export |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/cekYc/repo-monitor-2.git
cd repo-monitor-2
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Enter any GitHub username and click **Analyze**
2. Optionally add a [GitHub Personal Access Token](https://github.com/settings/tokens) to increase the rate limit from 60 to 5,000 requests/hour and enable full contribution heatmap data
3. Explore the charts, sort repos, filter by language, compare users, export as PNG

> **Tip:** The token is stored only in your browser's localStorage and is never sent anywhere other than GitHub's API.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/analyze?username=` | Full user analysis (JSON) |
| `GET /api/analyze-stream?username=` | SSE streaming analysis with progress |
| `GET /api/analyze-org?org=` | Organization analysis |
| `GET /api/badge/{username}` | SVG language badge (1hr cache) |
| `GET /api/contributions?username=` | 365-day contribution data |
| `GET /api/suggestions?languages=` | Trending repo suggestions |
| `GET /api/commit-history?owner=&repo=` | Commit history by language |
| `GET /api/rate-limit` | GitHub API rate limit status |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts         # Batch user analysis
│   │   ├── analyze-stream/route.ts  # SSE streaming analysis
│   │   ├── analyze-org/route.ts     # Organization analysis
│   │   ├── badge/[username]/route.ts # SVG badge generator
│   │   ├── contributions/route.ts   # Contribution heatmap data
│   │   ├── suggestions/route.ts     # Language-based suggestions
│   │   ├── commit-history/route.ts  # Repo commit timeline
│   │   └── rate-limit/route.ts      # Rate limit status
│   ├── globals.css
│   ├── layout.tsx                   # Root layout + PWA manifest
│   └── page.tsx                     # Main page (client component)
├── components/
│   ├── BadgeGenerator.tsx           # Embeddable badge with copy codes
│   ├── CommitHistory.tsx            # Stacked area chart per repo
│   ├── ContributionHeatmap.tsx      # GitHub-style 365-day heatmap
│   ├── LocaleProvider.tsx           # i18n context provider
│   ├── LocaleToggle.tsx             # Language switcher (TR/EN)
│   ├── OrgAnalyzer.tsx              # Organization analysis panel
│   ├── OverallStats.tsx             # Profile card + charts + PNG export
│   ├── PwaInstallButton.tsx         # PWA install prompt
│   ├── RateLimitBadge.tsx           # API rate limit indicator
│   ├── RepoCard.tsx                 # Expandable repo cards
│   ├── RepoSuggestions.tsx          # Trending repo suggestions
│   ├── SearchForm.tsx               # Search + compare form
│   ├── ThemeProvider.tsx            # Dark/light mode context
│   ├── ThemeToggle.tsx              # Theme toggle button
│   └── UserCompare.tsx              # Side-by-side user comparison
└── lib/
    ├── github.ts                    # Octokit service + type definitions
    ├── i18n.ts                      # Translation keys (200+ TR/EN)
    └── utils.ts                     # Colors, formatBytes, formatDate
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Author

Built by [**@cekYc**](https://github.com/cekYc)

## License

[MIT](LICENSE)
