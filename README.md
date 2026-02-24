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

</div>

---

## The Problem

GitHub profiles show a tiny language bar, but it doesn't tell you much. If you want to understand how a developer actually spends their time — which languages dominate their work, how their stack is distributed across projects, or how large each project is — you're left clicking through repos one by one.

**Repo Monitor** solves this by pulling all non-fork public repos for any user and generating a full language analysis with interactive visualizations, all in one view.

## Features

- **Profile Overview** — Avatar, bio, follower count, total codebase size
- **Overall Language Distribution** — Aggregated across all repos (Pie Chart + Bar Chart + Table)
- **Per-Repo Breakdown** — Language bar, percentages, size, dates for each repository
- **Expandable Detail View** — Click any repo card for a mini pie chart + full language table
- **Sort & Filter** — Filter by language, sort by last update / stars / size / language count / name
- **Fork Exclusion** — Only analyzes repositories the user authored (forks are excluded)
- **No Token Required** — Works without authentication (60 req/hr); add a token for 5,000 req/hr
- **Token Persistence** — Token is saved in localStorage, no need to re-enter
- **Client-Side Caching** — Results cached for 30 minutes to preserve API rate limits
- **Dark / Light Mode** — Toggle between themes instantly
- **12 Insight Metrics** — Dominant language, average repo size, most active repo, and more

## Tech Stack

| Technology | Role |
|---|---|
| [**Next.js 16**](https://nextjs.org/) (App Router) | Framework, API routes, SSR |
| [**TypeScript 5**](https://www.typescriptlang.org/) | Type safety |
| [**Tailwind CSS 4**](https://tailwindcss.com/) | Utility-first styling |
| [**Recharts**](https://recharts.org/) | Pie charts, bar charts |
| [**Octokit**](https://github.com/octokit/rest.js) | GitHub REST API client |

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
2. Optionally add a [GitHub Personal Access Token](https://github.com/settings/tokens) to increase the rate limit from 60 to 5,000 requests/hour
3. Explore the charts, sort repos, filter by language

> **Tip:** The token is stored only in your browser's localStorage and is never sent anywhere other than GitHub's API.

## Project Structure

```
src/
├── app/
│   ├── api/analyze/route.ts    # API endpoint — fetches & aggregates GitHub data
│   ├── globals.css              # Global styles + dark mode variant
│   ├── layout.tsx               # Root layout with ThemeProvider
│   └── page.tsx                 # Main page (client component, state management)
├── components/
│   ├── OverallStats.tsx         # Profile card, pie/bar charts, language table, insights
│   ├── RepoCard.tsx             # Expandable repo cards with language breakdown
│   ├── SearchForm.tsx           # Token + username form with persistence
│   ├── ThemeProvider.tsx        # Dark/light mode context + FOUC prevention
│   └── ThemeToggle.tsx          # Fixed-position theme toggle button
└── lib/
    ├── github.ts                # Octokit service, type definitions, data fetching
    └── utils.ts                 # Color palette, formatBytes, formatDate helpers
```

## How It Works

1. The client sends a request to `/api/analyze?username=...` (optionally with a token)
2. The API route uses Octokit to fetch all public, non-fork repos (paginated)
3. For each repo, the GitHub Languages API returns byte counts per language
4. Per-repo percentages are calculated, then aggregated into an overall distribution
5. All data is returned as JSON and rendered with Recharts visualizations
6. Results are cached in localStorage for 30 minutes to minimize API calls

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Author

Built by [**@cekYc**](https://github.com/cekYc)

## License

[MIT](LICENSE)
