"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n";
import useWatchCount from "@/components/shell/useWatchCount";

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: ReactNode;
  /** Sub-routes that belong to this section (repo detail sits under Analyze). */
  owns?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.analyze",
    owns: (p) => p === "/" || p.startsWith("/repo/"),
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.5l4.5-4.5 3 3L16.5 6M21 6v5.25M21 6h-5.25M4.5 20.25h15A1.5 1.5 0 0021 18.75V4.5"
      />
    ),
  },
  {
    href: "/watch",
    labelKey: "nav.watch",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.04 12.32a1 1 0 010-.64C3.42 7.51 7.36 4.5 12 4.5s8.57 3.01 9.96 7.18a1 1 0 010 .64C20.58 16.49 16.64 19.5 12 19.5s-8.57-3.01-9.96-7.18zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    href: "/compare",
    labelKey: "nav.compare",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    ),
  },
];

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="w-[18px] h-[18px] shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function useActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.owns ? item.owns(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Desktop navigation: three links in the header, no sidebar. */
export function NavInline({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const isActive = useActive();
  const watchCount = useWatchCount();

  return (
    <nav className={`items-center gap-0.5 ${className}`}>
      {NAV.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 h-9 px-2.5 rounded-lg t-small font-medium transition-colors ${
              active ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-panel hover:text-fg"
            }`}
          >
            <Icon>{item.icon}</Icon>
            <span>{t(item.labelKey)}</span>
            {item.href === "/watch" && watchCount > 0 && (
              <span
                className={`t-caption tnum rounded-pill px-1.5 ${
                  active ? "bg-accent text-accent-fg" : "bg-panel-strong text-muted"
                }`}
              >
                {watchCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile navigation: bottom tab bar, one row, thumb reach. */
export function NavBottomBar({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const isActive = useActive();
  const watchCount = useWatchCount();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-surface/95 backdrop-blur ${className}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-3">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-14 transition-colors ${
                active ? "text-accent-text" : "text-faint"
              }`}
            >
              <Icon>{item.icon}</Icon>
              <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
              {item.href === "/watch" && watchCount > 0 && (
                <span className="absolute top-2 right-[calc(50%-1.35rem)] min-w-4 h-4 px-1 rounded-pill bg-accent text-accent-fg text-[10px] font-semibold tnum grid place-items-center">
                  {watchCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
