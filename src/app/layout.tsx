import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import AuthButton from "@/components/AuthButton";
import LocaleToggle from "@/components/LocaleToggle";
import ThemeToggle from "@/components/ThemeToggle";

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
          <LocaleProvider>
            {/* YENİ HEADER DÜZENİ BURADA */}
            <header className="absolute top-0 w-full flex justify-end items-center gap-2 px-4 py-3 z-50">
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md px-2 py-1 rounded-2xl border border-gray-200 dark:border-gray-800">
                {/* Locale ve Theme butonlarının kendi içlerindeki absolute taglerini kaldırmana gerek yok, 
                    ancak CSS çakışmasını engellemek için onları bir div içinde topluyoruz */}
                <div className="relative flex items-center gap-2">
                  <LocaleToggle />
                  <ThemeToggle />
                </div>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div> {/* Ayırıcı dikey çizgi */}
                <AuthButton />
              </div>
            </header>
            
            {/* Sayfa içeriği üstten biraz boşluk bırakılarak başlıyor */}
            <div className="pt-16">
              {children}
            </div>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}