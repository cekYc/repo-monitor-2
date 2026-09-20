"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import GlobalSearch from "@/components/shell/GlobalSearch";
import LocaleToggle from "@/components/shell/LocaleToggle";
import SessionMenu from "@/components/shell/SessionMenu";
import ThemeToggle from "@/components/shell/ThemeToggle";
import { NavBottomBar, NavInline } from "@/components/shell/NavTabs";

/** One frame for every page.
 *
 *  Thin header: brand, three section links (desktop), the single search field,
 *  language, theme, and one identity/quota control. On phones the sections
 *  move to a bottom tab bar and language/theme fold into the session popover,
 *  so the header stays one row at any width. */
export default function AppFrame({ children }: { children: ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/90 backdrop-blur">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 h-14 flex items-center gap-2 md:gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Repo Monitor">
            <span className="w-7 h-7 rounded-lg bg-accent grid place-items-center shrink-0">
              <svg
                className="w-4 h-4 text-accent-fg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l2.5-6 4 13 3-9 1.5 2H21" />
              </svg>
            </span>
            <span className="hidden xl:block t-small font-semibold text-fg whitespace-nowrap">
              Repo Monitor
            </span>
          </Link>

          <NavInline className="hidden md:flex" />

          <GlobalSearch className="flex-1 min-w-0 md:max-w-sm md:ml-auto" />

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <LocaleToggle />
            <ThemeToggle />
          </div>

          <div className="shrink-0">
            <SessionMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 md:px-6 py-5 pb-24 md:pb-10">
        {children}
      </main>

      <footer className="hidden md:block border-t border-hairline">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-4 flex items-center justify-between t-caption text-faint">
          <span>{t("footer.copyright")}</span>
          <a
            href="https://github.com/cekYc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition-colors"
          >
            github.com/cekYc
          </a>
        </div>
      </footer>

      <NavBottomBar className="md:hidden" />
    </div>
  );
}
