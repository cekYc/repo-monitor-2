"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import useFormat from "@/components/useFormat";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import { getRepoActivityDate, getRepoActivityTimestamp } from "@/lib/repo-activity";
import type { RepoInfo } from "@/lib/github";

/** Derived observations. Secondary by design: useful once, not part of the
 *  headline read, so they live behind the insights tab. */
export default function InsightsPanel({ repos }: { repos: RepoInfo[] }) {
  const { t } = useLocale();
  const fmt = useFormat();

  const insights = useMemo(() => {
    if (repos.length === 0) return null;
    const bySize = [...repos].sort((a, b) => b.totalBytes - a.totalBytes);
    const byDate = [...repos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const dominant: Record<string, number> = {};
    for (const r of repos) {
      const top = r.languagePercentages[0]?.name;
      if (top) dominant[top] = (dominant[top] ?? 0) + 1;
    }
    return {
      dominant: Object.entries(dominant).sort((a, b) => b[1] - a[1])[0],
      biggest: bySize[0],
      smallest: bySize[bySize.length - 1],
      mostStarred: [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0],
      mostLangs: [...repos].sort(
        (a, b) => b.languagePercentages.length - a.languagePercentages.length
      )[0],
      newest: byDate[0],
      oldest: byDate[byDate.length - 1],
      recent: [...repos].sort((a, b) => getRepoActivityTimestamp(b) - getRepoActivityTimestamp(a))[0],
    };
  }, [repos]);

  if (!insights) return <p className="t-caption text-faint">{t("repos.notFound")}</p>;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {insights.dominant && (
        <Item
          label={t("insights.favLang")}
          value={insights.dominant[0]}
          detail={`${insights.dominant[1]} ${t("insights.favLangDetail")}`}
          color={getLanguageColor(insights.dominant[0], 0)}
        />
      )}
      <Item
        label={t("insights.biggestRepo")}
        value={insights.biggest.name}
        detail={formatBytes(insights.biggest.totalBytes)}
      />
      <Item
        label={t("insights.mostStarred")}
        value={insights.mostStarred.name}
        detail={`★ ${insights.mostStarred.stargazers_count}`}
      />
      <Item
        label={t("insights.mostLangs")}
        value={insights.mostLangs.name}
        detail={`${insights.mostLangs.languagePercentages.length} ${t("insights.differentLangs")}`}
      />
      <Item
        label={t("insights.lastUpdated")}
        value={insights.recent.name}
        detail={fmt.date(getRepoActivityDate(insights.recent))}
      />
      <Item
        label={t("insights.newestRepo")}
        value={insights.newest.name}
        detail={fmt.date(insights.newest.created_at)}
      />
      <Item
        label={t("insights.oldestRepo")}
        value={insights.oldest.name}
        detail={fmt.date(insights.oldest.created_at)}
      />
      <Item
        label={t("insights.smallestRepo")}
        value={insights.smallest.name}
        detail={formatBytes(insights.smallest.totalBytes)}
      />
    </div>
  );
}

function Item({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-hairline p-3 min-w-0">
      <div className="t-micro text-faint truncate">{label}</div>
      <div
        className="t-small font-medium truncate mt-1"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="t-caption text-faint truncate">{detail}</div>
    </div>
  );
}
