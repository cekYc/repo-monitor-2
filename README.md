<div align="center">

# Repo Monitor

**Visualize the language DNA of any GitHub profile.**

Analyze any GitHub user's public (non-fork) repositories and get a complete breakdown of their programming language usage — per repo and across all projects — with interactive charts and detailed statistics. Sign in with GitHub to also analyze your **private repositories**.

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-ceky--repo--monitor.vercel.app-black?style=for-the-badge&logo=vercel)](https://ceky-repo-monitor.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
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

**Repo Monitor** solves this by pulling all non-fork repos for any user and generating a full language analysis with interactive visualizations, all in one view.

## Features

### Authentication
- **GitHub OAuth Login** — Sign in with your GitHub account via OAuth 2.0
- **Private Repository Access** — When signed in as yourself, your private repos are included in the analysis
- **Secure Sessions** — Access tokens are stored in signed, HttpOnly cookies (JWT via `jose`) — never in localStorage or URL parameters
- **CSRF Protection** — OAuth state parameter validation on every login flow

### Core Analysis
- **Profile Overview** — Avatar, bio, follower count, total codebase size
- **Overall Language Distribution** — Aggregated across all repos (Pie Chart + Bar Chart + Table)
- **Per-Repo Breakdown** — Language bar, percentages, size, dates for each repository
- **Private Repo Badge** — 🔒 badge clearly marks private repositories in the list
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

### Advanced Analytics
- **Repo Health & Security Score** — Checks README, LICENSE, CI/CD, description, recency, issue ratio per repo → 0-100 score with Excellent/Good/Fair/Poor grades and gauge chart
- **Developer Persona & Gamification** — Commit time analysis → 6 unlockable badges: 🦉 Night Owl, 🐦 Early Bird, ⚔️ Weekend Warrior, 🌍 Polyglot, 🔥 Streaker, ♻️ Refactor Master
- **Custom Extension Scanner** — Define custom file extensions (e.g. `.cky` → Ceky Lang) and scan all repos using GitHub Trees API
- **Smart Server Cache** — Stale-while-revalidate caching with background revalidation, `X-Cache` headers (HIT/STALE/MISS)

### Organization & PWA
- **Organization Analysis** — Analyze any GitHub org's public repos with language distribution
- **PWA Support** — Install as a native app, offline-capable with service worker
- **Rate Limit Badge** — Live API rate limit countdown with color-coded warnings

### UX
- **Dark / Light Mode** — Toggle between themes instantly
- **English / Turkish (i18n)** — Full bilingual support with 250+ translation keys
- **Real-time Progress** — SSE streaming shows which repo is being analyzed
- **Client-Side Caching** — Results cached for 30 minutes
- **No Login Required** — Works without authentication (60 req/hr); sign in with GitHub for 5,000 req/hr + private repos

## Tech Stack

| Technology | Role |
|---|---|
| [**Next.js 15**](https://nextjs.org/) (App Router) | Framework, SSE streaming, API routes |
| [**TypeScript 5**](https://www.typescriptlang.org/) | Type safety |
| [**Tailwind CSS 4**](https://tailwindcss.com/) | Utility-first styling |
| [**Recharts**](https://recharts.org/) | Pie charts, bar charts, area charts |
| [**Octokit**](https://github.com/octokit/rest.js) | GitHub REST API client |
| [**jose**](https://github.com/panva/jose) | JWT signing & verification (edge-runtime compatible) |
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
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# GitHub OAuth App (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# JWT signing secret — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_32_char_secret

# App URL
NEXTAUTH_URL=http://localhost:3000
```

To create a GitHub OAuth App:
1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback` (for local dev)
3. Copy the **Client ID** and generate a **Client Secret**

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. **Without login** — Enter any GitHub username and click **Analyze** (public repos only, 60 req/hr)
2. **With GitHub login** — Click **Sign in with GitHub** in the top-right corner; your own profile will include private repositories and you get 5,000 req/hr

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/analyze?username=` | Full user analysis (JSON) — reads token from session cookie |
| `GET /api/analyze-stream?username=` | SSE streaming analysis with progress |
| `GET /api/analyze-org?org=` | Organization analysis |
| `GET /api/badge/{username}` | SVG language badge (1hr cache) |
| `GET /api/contributions?username=` | 365-day contribution data |
| `GET /api/suggestions?languages=` | Trending repo suggestions |
| `GET /api/commit-history?owner=&repo=` | Commit history by language |
| `GET /api/health-score?username=` | Repo health & security score |
| `GET /api/persona?username=` | Developer persona & badges |
| `GET /api/scan-extensions?username=&extensions=` | Custom extension scan |
| `GET /api/rate-limit` | GitHub API rate limit status |
| `GET /api/auth/signin` | Redirect to GitHub OAuth |
| `GET /api/auth/callback` | OAuth callback — sets session cookie |
| `POST /api/auth/signout` | Clear session cookie |
| `GET /api/auth/session` | Current user info (no token exposed) |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signin/route.ts      # GitHub OAuth redirect
│   │   │   ├── callback/route.ts    # OAuth callback + JWT cookie
│   │   │   ├── signout/route.ts     # Clear session
│   │   │   └── session/route.ts     # Current user (safe, no token)
│   │   ├── analyze/route.ts         # Batch user analysis
│   │   ├── analyze-stream/route.ts  # SSE streaming analysis
│   │   ├── analyze-org/route.ts     # Organization analysis
│   │   ├── badge/[username]/route.ts
│   │   ├── contributions/route.ts
│   │   ├── suggestions/route.ts
│   │   ├── commit-history/route.ts
│   │   ├── health-score/route.ts
│   │   ├── persona/route.ts
│   │   ├── scan-extensions/route.ts
│   │   └── rate-limit/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthButton.tsx               # GitHub login/logout button
│   ├── BadgeGenerator.tsx
│   ├── CommitHistory.tsx
│   ├── ContributionHeatmap.tsx
│   ├── LocaleProvider.tsx
│   ├── LocaleToggle.tsx
│   ├── OrgAnalyzer.tsx
│   ├── OverallStats.tsx
│   ├── RepoCard.tsx
│   ├── RepoSuggestions.tsx
│   ├── SearchForm.tsx
│   ├── ThemeProvider.tsx
│   ├── ThemeToggle.tsx
│   ├── UserCompare.tsx
│   ├── HealthScore.tsx
│   ├── DeveloperPersona.tsx
│   └── CustomExtensionScanner.tsx
└── lib/
    ├── auth.ts                      # JWT create/verify, session cookie helpers
    ├── github.ts                    # Octokit service + type definitions
    ├── i18n.ts                      # Translation keys (250+ TR/EN)
    ├── cache.ts                     # Server-side smart cache (SWR)
    └── utils.ts                     # Colors, formatBytes, formatDate
```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## Author

Built by [**@cekYc**](https://github.com/cekYc)

## License

[MIT](LICENSE)