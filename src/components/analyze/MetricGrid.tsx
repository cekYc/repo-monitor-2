"use client";

import { useMemo } from "react";
import StatTile from "@/components/ui/StatTile";
import useFormat from "@/components/useFormat";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

/** Level 3 of the hierarchy: six headline numbers, never more.
 *  Anything the profile summary or the language section already shows
 *  (followers, following, repo count, total code, language count) stays there
 *  so nothing is counted twice on one screen. */
export default function MetricGrid({
  repos,
  totalBytes,
}: {
  repos: RepoInfo[];
  totalBytes: number;
}) {
  const { t } = useLocale();
  const fmt = useFormat();

  const m = useMemo(() => {
    let stars = 0;
    let forks = 0;
    let commits = 0;
    let commitsLastMonth = 0;
    let activeRepos = 0;
    for (const r of repos) {
      stars += r.stargazers_count;
      forks += r.forks_count;
      commits += r.advancedMetrics?.totalCommits ?? 0;
      commitsLastMonth += r.advancedMetrics?.commitsLastMonth ?? 0;
      if ((r.advancedMetrics?.commitsLastMonth ?? 0) > 0) activeRepos += 1;
    }
    return {
      stars,
      forks,
      commits,
      commitsLastMonth,
      activeRepos,
      avgSize: repos.length ? totalBytes / repos.length : 0,
      avgLangs: repos.length
        ? repos.reduce((s, r) => s + r.languagePercentages.length, 0) / repos.length
        : 0,
    };
  }, [repos, totalBytes]);

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatTile
        label={t("metric.totalCommits")}
        value={fmt.num(m.commits)}
        delta={m.commitsLastMonth || undefined}
        sub={m.commitsLastMonth ? t("metric.lastMonth") : undefined}
      />
      <StatTile
        label={t("metric.activeRepos")}
        value={fmt.num(m.activeRepos)}
        sub={t("metric.lastMonth")}
      />
      <StatTile label={t("metric.totalStars")} value={fmt.num(m.stars)} />
      <StatTile label={t("metric.totalForks")} value={fmt.num(m.forks)} />
      <StatTile label={t("metric.avgRepoSize")} value={formatBytes(m.avgSize)} />
      <StatTile label={t("metric.avgLanguages")} value={m.avgLangs.toFixed(1)} />
    </section>
  );
}
