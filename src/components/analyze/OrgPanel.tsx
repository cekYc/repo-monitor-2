"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import ErrorNotice from "@/components/ui/ErrorNotice";
import SegmentBar from "@/components/SegmentBar";
import { useLocale } from "@/components/LocaleProvider";
import { codeFromResponse, toErrorCode, type ErrorCode } from "@/lib/errors";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import { tokenHeaders } from "@/lib/token";
import type { OrgAnalysis } from "@/lib/github";

/** Organization view of the current target.
 *
 *  It has no input of its own: the header search already accepts an org, so
 *  this panel simply asks "read this handle as an organization" and reports
 *  plainly when the handle is a person. */
export default function OrgPanel({ login }: { login: string }) {
  const { t } = useLocale();
  const [data, setData] = useState<OrgAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze-org?org=${encodeURIComponent(login)}`, {
        headers: tokenHeaders(),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(codeFromResponse(payload, res.status));
        return;
      }
      setData(payload as OrgAnalysis);
    } catch (err) {
      setError(toErrorCode(err));
    } finally {
      setLoading(false);
    }
  };

  if (error === "not_found") {
    return <p className="t-caption text-faint">{t("org.notAnOrg")}</p>;
  }

  if (error) {
    return <ErrorNotice code={error} onRetry={run} inline />;
  }

  if (!data) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t-caption text-muted">{t("org.prompt")}</p>
        <button type="button" onClick={run} disabled={loading} className="btn btn-ghost btn-sm">
          {loading ? t("org.loading") : t("org.submit")}
        </button>
      </div>
    );
  }

  const { org, overallLanguages } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar src={org.avatar_url} label={org.login} size={44} rounded="lg" />
        <div className="min-w-0">
          <a
            href={org.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="t-small font-medium text-fg hover:text-accent-text transition-colors"
          >
            {org.name || org.login}
          </a>
          {org.description && (
            <p className="t-caption text-muted line-clamp-2 mt-0.5">{org.description}</p>
          )}
          <p className="t-caption text-faint mt-1 tnum">
            {data.totalRepos} {t("org.publicRepos")}
            {org.members_count !== undefined && ` · ${org.members_count} ${t("org.members")}`}
            {` · ${formatBytes(data.totalBytes)}`}
          </p>
        </div>
      </div>

      <div>
        <SegmentBar segments={overallLanguages} height={10} />
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {overallLanguages.slice(0, 8).map((l, i) => (
            <span key={l.name} className="inline-flex items-center gap-1.5 t-caption text-muted">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: getLanguageColor(l.name, i) }}
              />
              {l.name}
              <span className="text-faint tnum">{l.value}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
