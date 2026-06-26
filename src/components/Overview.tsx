"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { listWatches, type WatchItem } from "@/lib/watchlist";

interface RecentSearch {
  username: string;
  avatarUrl?: string;
}

interface OverviewProps {
  recentSearches: RecentSearch[];
  onAnalyzeUser: (login: string) => void;
  onGoWatchlist: () => void;
}

const EXAMPLES = ["torvalds", "facebook", "sindresorhus/slugify"];

export default function Overview({ recentSearches, onAnalyzeUser, onGoWatchlist }: OverviewProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [watches, setWatches] = useState<WatchItem[]>([]);

  useEffect(() => {
    listWatches().then(setWatches);
  }, []);

  const go = (raw: string) => {
    const v = raw.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    if (!v) return;
    if (v.includes("/")) {
      const [owner, repo] = v.split("/");
      if (owner && repo) router.push(`/repo/${owner}/${repo}`);
    } else {
      onAnalyzeUser(v);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick analyze hero */}
      <section className="rounded-2xl border border-hairline bg-surface p-6 md:p-8">
        <h1 className="text-xl md:text-2xl font-semibold text-fg">{t("overview.welcomeTitle")}</h1>
        <p className="text-muted mt-1.5 max-w-xl text-sm md:text-base">{t("overview.welcomeBody")}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(query);
            setQuery("");
          }}
          className="mt-5 flex flex-col sm:flex-row gap-2 max-w-xl"
        >
          <div className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-hairline bg-canvas flex-1 focus-within:border-accent transition-colors">
            <svg className="w-[18px] h-[18px] text-faint shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-faint min-w-0"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors cursor-pointer"
          >
            {t("overview.quickAnalyze")}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-faint">{t("search.recent")}:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => go(ex)}
              className="text-xs font-mono text-accent-text hover:underline cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* Watching */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-fg">
            {t("overview.watching")}
            {watches.length > 0 && <span className="text-faint font-normal ml-2 tnum">{watches.length}</span>}
          </h2>
          {watches.length > 0 && (
            <button onClick={onGoWatchlist} className="text-xs text-accent-text hover:underline cursor-pointer">
              {t("overview.viewAll")} →
            </button>
          )}
        </div>

        {watches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline-strong p-8 text-center">
            <p className="text-sm text-muted">{t("overview.noWatches")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {watches.slice(0, 6).map((w) => {
              const isRepo = w.type === "repo";
              const inner = (
                <>
                  {w.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.avatarUrl} alt={w.label} className="w-9 h-9 rounded-full shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-text grid place-items-center text-sm shrink-0">
                      {isRepo ? "{ }" : w.label[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg truncate">{w.label}</div>
                    <div className="text-[11px] uppercase tracking-wide text-faint">{isRepo ? "repo" : "user"}</div>
                  </div>
                </>
              );
              return isRepo ? (
                <Link key={w.id} href={`/repo/${w.label}`} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3 hover:border-hairline-strong transition-colors">
                  {inner}
                </Link>
              ) : (
                <button key={w.id} onClick={() => onAnalyzeUser(w.label)} className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3 hover:border-hairline-strong transition-colors text-left cursor-pointer">
                  {inner}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-fg mb-3">{t("overview.recent")}</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((r) => (
              <button
                key={r.username}
                onClick={() => onAnalyzeUser(r.username)}
                className="flex items-center gap-2 rounded-full border border-hairline bg-surface pl-1.5 pr-3 py-1.5 hover:border-hairline-strong transition-colors cursor-pointer"
              >
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.avatarUrl} alt={r.username} className="w-5 h-5 rounded-full" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-panel grid place-items-center text-[10px]">{r.username[0]?.toUpperCase()}</span>
                )}
                <span className="text-xs font-medium text-fg">{r.username}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
