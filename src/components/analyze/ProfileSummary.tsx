"use client";

import Avatar from "@/components/ui/Avatar";
import SegmentBar from "@/components/SegmentBar";
import WatchButton from "@/components/WatchButton";
import { useLocale } from "@/components/LocaleProvider";
import useFormat from "@/components/useFormat";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import type { UserAnalysis } from "@/lib/github";

/** Level 1 of the result hierarchy: who this is, how big they are, and the one
 *  action that turns a look-up into tracking. */
export default function ProfileSummary({
  analysis,
  totalBytes,
  languages,
  isSample,
  onExport,
  exporting,
}: {
  analysis: UserAnalysis;
  totalBytes: number;
  languages: { name: string; value: number }[];
  isSample: boolean;
  onExport?: () => void;
  exporting?: boolean;
}) {
  const { t } = useLocale();
  const fmt = useFormat();
  const { user } = analysis;

  return (
    <section className="card p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        {/* Identity */}
        <div className="flex items-start gap-3.5 min-w-0 md:w-[46%]">
          <Avatar src={user.avatar_url} label={user.login} size={56} rounded="lg" />
          <div className="min-w-0">
            <h1 className="t-display text-fg truncate">{user.name || user.login}</h1>
            {isSample ? (
              <span className="t-caption text-faint font-mono">@{user.login}</span>
            ) : (
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="t-caption text-muted hover:text-accent-text transition-colors font-mono"
              >
                @{user.login}
              </a>
            )}
            {user.bio && <p className="t-caption text-muted mt-1.5 line-clamp-2">{user.bio}</p>}
          </div>
        </div>

        {/* Headline figures + distribution preview */}
        <div className="flex-1 min-w-0">
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            <Figure label={t("stats.followers")} value={fmt.num(user.followers)} />
            <Figure label={t("stats.following")} value={fmt.num(user.following)} />
            <Figure label={t("metric.repoCount")} value={fmt.num(analysis.repos.length)} />
            <Figure label={t("metric.totalBytes")} value={formatBytes(totalBytes)} />
          </dl>

          <div className="mt-4">
            <SegmentBar segments={languages} height={12} />
            <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2.5">
              {languages.slice(0, 4).map((l, i) => (
                <span key={l.name} className="inline-flex items-center gap-1.5 t-caption text-muted">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: getLanguageColor(l.name, i) }}
                  />
                  {l.name}
                  <span className="text-faint tnum">{l.value}%</span>
                </span>
              ))}
              {languages.length > 4 && (
                <span className="t-caption text-faint tnum">+{languages.length - 4}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isSample && (
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-hairline">
          <WatchButton
            type="user"
            label={user.login}
            avatarUrl={user.avatar_url}
          />
          {onExport && (
            <button type="button" onClick={onExport} disabled={exporting} className="btn btn-ghost btn-sm">
              {exporting ? t("stats.exporting") : t("stats.export")}
            </button>
          )}
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm ml-auto"
          >
            {t("action.openOnGithub")}
          </a>
        </div>
      )}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="t-micro text-faint">{label}</dt>
      <dd className="t-title text-fg tnum mt-0.5">{value}</dd>
    </div>
  );
}
