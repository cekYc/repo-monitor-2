"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  errorBodyKey,
  errorTitleKey,
  needsAuthCta,
  type ErrorCode,
} from "@/lib/errors";
import { OPEN_SESSION_EVENT, QUOTA_STALE_EVENT } from "@/lib/ui-events";

/** Single rendering path for every failure in the app.
 *  - copy comes from the error code, so it is always translated
 *  - quota / credential failures always carry the sign-in + token CTA
 *  - `inline` is the compact banner used above stale cached content */
export default function ErrorNotice({
  code,
  onRetry,
  inline = false,
  className = "",
}: {
  code: ErrorCode;
  onRetry?: () => void;
  inline?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const withAuth = needsAuthCta(code);

  // A quota failure makes whatever the header last read obsolete.
  useEffect(() => {
    if (code === "rate_limit") window.dispatchEvent(new Event(QUOTA_STALE_EVENT));
  }, [code]);

  const tone = withAuth ? "warning" : "danger";

  const toneClass =
    tone === "warning"
      ? "bg-warning-soft text-warning"
      : "bg-danger-soft text-danger";

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {withAuth && (
        <>
          <a href="/api/auth/signin" className="btn btn-primary btn-sm">
            {t("auth.signIn")}
          </a>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_SESSION_EVENT))}
            className="btn btn-ghost btn-sm"
          >
            {t("auth.addToken")}
          </button>
        </>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost btn-sm">
          {t("action.retry")}
        </button>
      )}
    </div>
  );

  if (inline) {
    return (
      <div
        role="alert"
        className={`rounded-lg border border-hairline ${toneClass} px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 ${className}`}
      >
        <p className="t-caption font-medium">{t(errorTitleKey(code))}</p>
        {actions}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`card p-5 flex flex-col items-start gap-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${toneClass}`}
          aria-hidden
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.008M10.34 3.94l-7.6 13.15A1.5 1.5 0 004.04 19.5h15.92a1.5 1.5 0 001.3-2.41l-7.6-13.15a1.5 1.5 0 00-2.6 0z"
            />
          </svg>
        </span>
        <div className="space-y-1">
          <p className="t-body font-medium text-fg">{t(errorTitleKey(code))}</p>
          <p className="t-caption text-muted">{t(errorBodyKey(code))}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
