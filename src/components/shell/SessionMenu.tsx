"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GitHubAvatar from "@/components/GitHubAvatar";
import LocaleToggle from "@/components/shell/LocaleToggle";
import ThemeToggle from "@/components/shell/ThemeToggle";
import PwaInstallButton from "@/components/shell/PwaInstallButton";
import { useLocale } from "@/components/LocaleProvider";
import { useSession } from "@/components/SessionProvider";
import { setStoredToken, TOKEN_KEY, tokenHeaders } from "@/lib/token";
import { useStoredString } from "@/lib/use-stored";
import { OPEN_SESSION_EVENT, QUOTA_STALE_EVENT } from "@/lib/ui-events";
import {
  formatCountdown,
  isAlarming,
  quotaBarClass,
  quotaDotClass,
  quotaLevel,
  quotaToneClass,
  type RateLimitInfo,
} from "@/lib/quota";

/** The only identity/quota control in the app.
 *
 *  Everything that used to be its own header button or floating widget —
 *  sign in, sign out, the rate-limit badge, the PAT field, the PWA install
 *  prompt — is one trigger and one popover here. */
export default function SessionMenu() {
  const { t } = useLocale();
  const { user, loading, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<RateLimitInfo | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [tokenVisible, setTokenVisible] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // The stored token is the source of truth, so the field stays in step with
  // any other tab that changes it.
  const token = useStoredString(TOKEN_KEY, "");

  const loadQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/rate-limit", {
        cache: "no-store",
        headers: tokenHeaders(),
      });
      if (res.ok) setInfo((await res.json()) as RateLimitInfo);
    } catch {
      // a missing quota readout must never break the header
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadQuota();
    })();
    const id = setInterval(loadQuota, 60_000);
    const onStale = () => void loadQuota();
    window.addEventListener(QUOTA_STALE_EVENT, onStale);
    return () => {
      clearInterval(id);
      window.removeEventListener(QUOTA_STALE_EVENT, onStale);
    };
  }, [loadQuota]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  // Rate-limit banners elsewhere in the app open this popover instead of
  // growing a second quota UI next to it.
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setTokenOpen(true);
    };
    window.addEventListener(OPEN_SESSION_EVENT, handler);
    return () => window.removeEventListener(OPEN_SESSION_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const level = info ? quotaLevel(info) : "neutral";
  const exhausted = level === "critical";
  // A 60/60 anonymous ceiling is shown in alarm colours too — it reads full but
  // is one analysis from empty, and the fix is the same action.
  const alarm = info ? isAlarming(info) : false;
  const pct = info && info.limit > 0 ? Math.round((info.remaining / info.limit) * 100) : 0;

  const onTokenChange = (value: string) => {
    setStoredToken(value);
    void loadQuota();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("auth.account")}
        className={`btn h-9 gap-2 px-2 ${
          alarm ? "bg-danger-soft border border-danger/40 text-danger" : "btn-ghost"
        }`}
      >
        {info && (
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${alarm ? "bg-danger" : quotaDotClass(level)}`}
            />
            {/* A quota in alarm is the one number worth header space on a phone. */}
            <span
              className={`t-caption tnum ${
                alarm ? "inline" : `hidden sm:inline ${quotaToneClass(level)}`
              }`}
            >
              {info.remaining}/{info.limit}
            </span>
          </span>
        )}
        {loading ? (
          <span className="skeleton h-5 w-5 rounded-full" />
        ) : user ? (
          <GitHubAvatar
            src={user.avatarUrl}
            alt={user.login}
            identity={user.login}
            width={22}
            height={22}
            className="rounded-full"
          />
        ) : (
          <span className="t-caption font-medium">{t("auth.signIn")}</span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("auth.account")}
          className="pop absolute right-0 top-[calc(100%+8px)] w-[19rem] max-w-[calc(100vw-2rem)] p-3 z-50"
        >
          {/* Identity */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <GitHubAvatar
                  src={user.avatarUrl}
                  alt={user.login}
                  identity={user.login}
                  width={34}
                  height={34}
                  className="rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div className="t-small font-medium text-fg truncate">{user.login}</div>
                  <div className="t-caption text-faint">{t("auth.signedIn")}</div>
                </div>
                <button type="button" onClick={signOut} className="btn btn-ghost btn-sm">
                  {t("auth.signOut")}
                </button>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <div className="t-small font-medium text-fg">{t("auth.anonymous")}</div>
                  <div className="t-caption text-faint">{t("auth.anonymousHint")}</div>
                </div>
                <a href="/api/auth/signin" className="btn btn-primary btn-sm">
                  {t("auth.signIn")}
                </a>
              </>
            )}
          </div>

          {/* Quota */}
          <div className="mt-3 pt-3 border-t border-hairline">
            <div className="flex items-center justify-between">
              <span className="t-caption text-muted">{t("quota.label")}</span>
              {info && (
                <span className={`t-caption tnum ${quotaToneClass(level)}`}>
                  {info.remaining}/{info.limit}
                </span>
              )}
            </div>
            {info ? (
              <>
                <div className="mt-2 h-1.5 rounded-full bg-panel overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${quotaBarClass(alarm ? "critical" : level)}`}
                    style={{ width: `${Math.max(pct, info.remaining > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 t-caption text-faint tnum">
                  <span>
                    {info.used} {t("quota.used")}
                  </span>
                  <span>
                    {t("quota.reset")} {formatCountdown(info.reset, now)}
                  </span>
                </div>
                {alarm && (
                  <p className="t-caption text-danger mt-2">
                    {exhausted ? t("quota.exhausted") : t("quota.lowCeiling")}
                  </p>
                )}
              </>
            ) : (
              <div className="skeleton h-1.5 mt-2" />
            )}
          </div>

          {/* Advanced: personal access token */}
          <div className="mt-3 pt-3 border-t border-hairline">
            <button
              type="button"
              onClick={() => setTokenOpen((v) => !v)}
              aria-expanded={tokenOpen}
              className="w-full flex items-center justify-between gap-2 cursor-pointer group"
            >
              <span className="t-caption text-muted group-hover:text-fg transition-colors">
                {t("token.advanced")}
              </span>
              <span className="flex items-center gap-1.5">
                {token && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                <svg
                  className={`w-3.5 h-3.5 text-faint transition-transform ${tokenOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {tokenOpen && (
              <div className="mt-2">
                <div className="relative">
                  <input
                    type={tokenVisible ? "text" : "password"}
                    value={token}
                    onChange={(e) => onTokenChange(e.target.value)}
                    placeholder={t("token.placeholder")}
                    autoComplete="off"
                    spellCheck={false}
                    className="field pr-16 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {token && (
                      <button
                        type="button"
                        onClick={() => onTokenChange("")}
                        className="p-1 rounded text-faint hover:text-danger transition-colors"
                        aria-label={t("token.clear")}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTokenVisible((v) => !v)}
                      className="p-1 rounded text-faint hover:text-fg transition-colors"
                      aria-label={t("token.toggleVisibility")}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32a1 1 0 010-.64C3.42 7.51 7.36 4.5 12 4.5s8.57 3.01 9.96 7.18a1 1 0 010 .64C20.58 16.49 16.64 19.5 12 19.5s-8.57-3.01-9.96-7.18z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="t-caption text-faint mt-1.5">{t("token.hint")}</p>
              </div>
            )}
          </div>

          {/* Preferences — visible here only where the header cannot hold them */}
          <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-2 sm:hidden">
            <LocaleToggle />
            <ThemeToggle />
          </div>
          <PwaInstallButton />
        </div>
      )}
    </div>
  );
}
