"use client";

import { useMemo } from "react";
import StatTile from "@/components/ui/StatTile";
import useFormat from "@/components/useFormat";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

/** Level 3 of the hierarchy: eight headline numbers, never more.
 *  Followers and following stay in the profile summary so nothing is counted
 *  twice on one screen. */
export default function MetricGrid({
  repos,
  totalBytes,
  languageCount,
}: {
  repos: RepoInfo[];
  totalBytes: number;
  languageCount: number;
}) {
  const { t } = useLocale();
  const fmt = useFormat();

  const m = useMemo(() => {
    let stars = 0;
    let forks = 0;
    let commits = 0;
    let commitsLastMonth = 0;
    for (const r of repos) {
      stars += r.stargazers_count;
      forks += r.forks_count;
      commits += r.advancedMetrics?.totalCommits ?? 0;
      commitsLastMonth += r.advancedMetrics?.commitsLastMonth ?? 0;
    }
    return {
      stars,
      forks,
      commits,
      commitsLastMonth,
      avgSize: repos.length ? totalBytes / repos.length : 0,
      avgLangs: repos.length
        ? repos.reduce((s, r) => s + r.languagePercentages.length, 0) / repos.length
        : 0,
    };
  }, [repos, totalBytes]);

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatTile label={t("metric.repoCount")} value={fmt.num(repos.length)} />
      <StatTile label={t("metric.totalStars")} value={fmt.num(m.stars)} />
      <StatTile label={t("metric.totalForks")} value={fmt.num(m.forks)} />
      <StatTile label={t("metric.totalBytes")} value={formatBytes(totalBytes)} />
      <StatTile label={t("metric.languages")} value={fmt.num(languageCount)} />
      <StatTile
        label={t("metric.totalCommits")}
        value={fmt.num(m.commits)}
        delta={m.commitsLastMonth || undefined}
        sub={m.commitsLastMonth ? t("metric.lastMonth") : undefined}
      />
      <StatTile label={t("metric.avgRepoSize")} value={formatBytes(m.avgSize)} />
      <StatTile label={t("metric.avgLanguages")} value={m.avgLangs.toFixed(1)} />
    </section>
  );
}
