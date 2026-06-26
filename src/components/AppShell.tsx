"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";
import LocaleToggle from "@/components/LocaleToggle";
import ThemeToggle from "@/components/ThemeToggle";
import AuthButton from "@/components/AuthButton";

export type ViewId = "overview" | "analyze" | "watchlist" | "compare";

interface AppShellProps {
  active: ViewId;
  onNavigate: (id: ViewId) => void;
  onAnalyzeUser: (login: string) => void;
  watchCount?: number;
  children: ReactNode;
}

function Icon({ path }: { path: ReactNode }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
      {path}
    </svg>
  );
}

const NAV: { id: ViewId; labelKey: TranslationKey; icon: ReactNode }[] = [
  {
    id: "overview",
    labelKey: "nav.overview",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  },
  {
    id: "analyze",
    labelKey: "nav.analyze",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
  },
  {
    id: "watchlist",
    labelKey: "nav.watchlist",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
  {
    id: "compare",
    labelKey: "nav.compare",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />,
  },
];

export default function AppShell({ active, onNavigate, onAnalyzeUser, watchCount = 0, children }: AppShellProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const v = query.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!v) return;
    if (v.includes("/")) {
      const [owner, repo] = v.split("/");
      if (owner && repo) router.push(`/repo/${owner}/${repo}`);
    } else {
      onAnalyzeUser(v);
    }
    setQuery("");
  };

  const navButton = (item: (typeof NAV)[number], compact?: boolean) => {
    const isActive = active === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
          compact ? "px-3 py-2" : "px-3 py-2 w-full"
        } ${
          isActive
            ? "bg-accent-soft text-accent-text"
            : "text-muted hover:bg-panel hover:text-fg"
        }`}
      >
        <Icon path={item.icon} />
        <span>{t(item.labelKey)}</span>
        {item.id === "watchlist" && watchCount > 0 && (
          <span className={`ml-auto text-[11px] tnum rounded-full px-1.5 py-0.5 ${isActive ? "bg-accent text-accent-fg" : "bg-panel text-muted"}`}>
            {watchCount}
          </span>
        )}
      </button>
    );
  };

  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-accent grid place-items-center shrink-0">
        <svg className="w-4 h-4 text-accent-fg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2.5-6 4 13 3-9 1.5 2H21" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-fg">Repo Monitor</div>
        <div className="text-[11px] text-faint">{t("nav.tagline")}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-canvas text-fg">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-hairline px-3 py-4 sticky top-0 h-screen">
        <div className="px-2 pb-5">{brand}</div>
        <nav className="flex flex-col gap-1">{NAV.map((item) => navButton(item))}</nav>
        <div className="mt-auto flex items-center gap-2 px-1 pt-4 border-t border-hairline">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur border-b border-hairline">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14">
            {/* Mobile brand */}
            <div className="lg:hidden">{brand}</div>

            <form onSubmit={submitQuery} className="flex-1 max-w-md hidden sm:block">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-hairline bg-surface focus-within:border-hairline-strong transition-colors">
                <svg className="w-[15px] h-[15px] text-faint shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("nav.searchPlaceholder")}
                  className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-faint min-w-0"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <div className="lg:hidden flex items-center gap-2">
                <LocaleToggle />
                <ThemeToggle />
              </div>
              <AuthButton />
            </div>
          </div>

          {/* Mobile nav row */}
          <nav className="lg:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
            {NAV.map((item) => navButton(item, true))}
          </nav>
        </header>

        <main className="flex-1 px-4 md:px-6 py-6">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
