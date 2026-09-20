"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GitHubAvatar from "@/components/GitHubAvatar";
import { useLocale } from "@/components/LocaleProvider";
import { getRecentSearches, type RecentSearch } from "@/lib/recent";
import { parseTarget, targetHref, targetLabel } from "@/lib/target";
import { FOCUS_SEARCH_EVENT } from "@/lib/ui-events";

/** The app's only search field.
 *
 *  It accepts a user, an org, an `owner/repo` or a pasted github.com URL and
 *  routes to the right page. No screen is allowed to grow a second search box;
 *  section-level filters are filters, not search. */
export default function GlobalSearch({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // History is read when the dropdown is about to be shown, so it is always
  // current and nothing has to load on mount.
  const target = useMemo(() => parseTarget(query), [query]);

  const go = useCallback(
    (raw: string) => {
      const parsed = parseTarget(raw);
      if (!parsed) return;
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
      router.push(targetHref(parsed));
    },
    [router]
  );

  // "/" and Cmd/Ctrl-K focus the field from anywhere that is not a text input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      const shortcut = (e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing);
      if (!shortcut) return;
      e.preventDefault();
      inputRef.current?.focus();
      setRecent(getRecentSearches());
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
      setRecent(getRecentSearches());
      setOpen(true);
    };
    window.addEventListener(FOCUS_SEARCH_EVENT, handler);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const showRecent = !query.trim() && recent.length > 0;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
      >
        <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-hairline bg-surface focus-within:border-accent transition-colors">
          <svg
            className="w-4 h-4 text-faint shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7.5 7.5 0 105.2 5.2a7.5 7.5 0 0010.6 10.6z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setRecent(getRecentSearches());
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent outline-none t-small text-fg placeholder:text-faint min-w-0"
          />
          <kbd className="hidden lg:inline-flex items-center h-5 px-1.5 rounded border border-hairline bg-panel t-caption text-faint font-sans">
            /
          </kbd>
        </div>
      </form>

      {open && (query.trim() || showRecent) && (
        <div className="pop absolute left-0 right-0 top-[calc(100%+6px)] p-1.5 z-50 max-h-[60vh] overflow-y-auto">
          {query.trim() &&
            (target ? (
              <button
                type="button"
                onClick={() => go(query)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-panel transition-colors text-left cursor-pointer"
              >
                <span className="w-6 h-6 rounded-md bg-accent-soft text-accent-text grid place-items-center shrink-0">
                  {target.kind === "repo" ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 016.5 3H18a1 1 0 011 1v16a1 1 0 01-1 1H6.5A2.5 2.5 0 014 18.5v-13zM4 18.5A2.5 2.5 0 016.5 16H19" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.1a7.5 7.5 0 0115 0v.4H4.5v-.4z" />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block t-small text-fg font-medium truncate font-mono">
                    {targetLabel(target)}
                  </span>
                  <span className="block t-caption text-faint">
                    {target.kind === "repo" ? t("search.asRepo") : t("search.asUser")}
                  </span>
                </span>
                <span className="t-caption text-faint shrink-0">↵</span>
              </button>
            ) : (
              <p className="px-2 py-2.5 t-caption text-faint">{t("search.invalid")}</p>
            ))}

          {showRecent && (
            <>
              <p className="px-2 pt-1.5 pb-1 t-micro text-faint">{t("search.recent")}</p>
              {recent.map((r) => (
                <button
                  key={r.username}
                  type="button"
                  onClick={() => go(r.username)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-panel transition-colors text-left cursor-pointer"
                >
                  {r.avatarUrl ? (
                    <GitHubAvatar
                      src={r.avatarUrl}
                      alt=""
                      identity={r.username}
                      width={22}
                      height={22}
                      className="rounded-full shrink-0"
                    />
                  ) : (
                    <span className="w-[22px] h-[22px] rounded-full bg-panel grid place-items-center t-caption text-faint shrink-0">
                      {r.username[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="t-small text-fg truncate">{r.username}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
