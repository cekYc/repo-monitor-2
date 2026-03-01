import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repo Monitor — Visualize GitHub Language DNA",
  description:
    "Analyze any GitHub user's public repositories and get a complete breakdown of programming language usage with interactive charts.",
  keywords: ["GitHub", "repository", "language analysis", "code statistics", "developer tools", "programming languages"],
  authors: [{ name: "cekYc", url: "https://github.com/cekYc" }],
  openGraph: {
    title: "Repo Monitor — Visualize GitHub Language DNA",
    description: "Analyze any GitHub user's repos and see their programming language distribution with interactive charts.",
    url: "https://ceky-repo-monitor.vercel.app",
    siteName: "Repo Monitor",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Repo Monitor — Visualize GitHub Language DNA",
    description: "Analyze any GitHub user's repos and see their programming language distribution with interactive charts.",
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
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
