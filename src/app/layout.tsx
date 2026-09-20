import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider, type Theme } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import AppFrame from "@/components/shell/AppFrame";
import type { Locale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repo Monitor — GitHub analysis & tracking",
  description:
    "Analyze any GitHub user, org or repository: language DNA, repo metrics, health and persona — then watch it for changes over time.",
  keywords: [
    "GitHub",
    "repository analysis",
    "language statistics",
    "developer tools",
    "repo monitoring",
  ],
  authors: [{ name: "cekYc", url: "https://github.com/cekYc" }],
  openGraph: {
    title: "Repo Monitor — GitHub analysis & tracking",
    description:
      "Language DNA, repo metrics and change tracking for any GitHub user, org or repository.",
    url: "https://ceky-repo-monitor.vercel.app",
    siteName: "Repo Monitor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Repo Monitor — GitHub analysis & tracking",
    description:
      "Language DNA, repo metrics and change tracking for any GitHub user, org or repository.",
  },
  metadataBase: new URL("https://ceky-repo-monitor.vercel.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repo Monitor",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

// Sets the theme class before first paint for visitors whose preference lives
// in localStorage but not yet in the cookie.
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('repo-monitor-theme');if(t==='light')document.documentElement.classList.remove('dark');else if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const theme: Theme = store.get("repo-monitor-theme")?.value === "light" ? "light" : "dark";
  const locale: Locale = store.get("repo-monitor-locale")?.value === "en" ? "en" : "tr";

  return (
    <html lang={locale} className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider initialTheme={theme}>
          <LocaleProvider initialLocale={locale}>
            <SessionProvider>
              <AppFrame>{children}</AppFrame>
            </SessionProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
