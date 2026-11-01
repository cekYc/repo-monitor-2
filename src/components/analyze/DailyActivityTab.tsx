"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Segmented from "@/components/ui/Segmented";
import Avatar from "@/components/ui/Avatar";
import { useLocale } from "@/components/LocaleProvider";
import useFormat from "@/components/useFormat";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import type {
  DailyActivityEntry,
  DailyRepoCommitActivity,
  DailyRepoCreated,
  RepoActivitySummary,
  RepoInfo,
  UserDailyActivityResponse,
} from "@/lib/github";

type ViewMode = "timeline" | "repos";
type ActivityFilter = "all" | "created" | "commits";
type DaySort = "dateDesc" | "dateAsc" | "linesDesc" | "commitsDesc";

const INITIAL_DAYS_SHOWN = 20;

/** Merge client-side analyzed repos into the API daily activity response so
 *  every owned repo creation date and commit date is present. Commit days that
 *  only the client knows about carry no line stats: the client knows when the
 *  commits happened, not how large they were, so nothing is estimated. */
function mergeWithClientRepos(
  apiData: UserDailyActivityResponse | null,
  ownedRepos: RepoInfo[],
  contributedRepos: RepoInfo[] | null,
  owner: string
): UserDailyActivityResponse {
  const dayMap = new Map<string, DailyActivityEntry>();
  const summaryMap = new Map<string, RepoActivitySummary>();
  // Repos whose commits are still streaming in get no client-side stand-in:
  // their real commits are on the way.
  const pendingRepos = new Set(apiData?.pendingRepos ?? []);

  const ensureDay = (date: string): DailyActivityEntry => {
    let d = dayMap.get(date);
    if (!d) {
      d = {
        date,
        reposCreated: [],
        repoCommits: [],
        totalCommits: 0,
        totalAdditions: 0,
        totalDeletions: 0,
      };
      dayMap.set(date, d);
    }
    return d;
  };

  // Merge all owned repos & contributed repos from client state
  const allClientRepos = [
    ...ownedRepos.map((r) => ({ repo: r, isContributed: false })),
    ...(contributedRepos ?? []).map((r) => ({ repo: r, isContributed: true })),
  ];

  // Build lookup maps for creation dates and accurate source code bytes
  const createdDateByRepo = new Map<string, string>();
  const accurateBytesByRepo = new Map<string, number>();

  if (apiData) {
    for (const s of apiData.repoSummaries) {
      if (s.createdAt) {
        createdDateByRepo.set(s.fullName.toLowerCase(), s.createdAt.slice(0, 10));
        createdDateByRepo.set(s.repoName.toLowerCase(), s.createdAt.slice(0, 10));
      }
    }
  }

  for (const { repo } of allClientRepos) {
    const repoOwner = repo.ownerLogin || owner;
    const fullName = (repo.fullName || `${repoOwner}/${repo.name}`).toLowerCase();
    const shortName = repo.name.toLowerCase();
    if (repo.created_at) {
      const cDay = repo.created_at.slice(0, 10);
      createdDateByRepo.set(fullName, cDay);
      createdDateByRepo.set(shortName, cDay);
    }
    if (repo.totalBytes > 0) {
      accurateBytesByRepo.set(fullName, repo.totalBytes);
      accurateBytesByRepo.set(shortName, repo.totalBytes);
    }
  }

  if (apiData) {
    for (const d of apiData.days) {
      const validCommits = d.repoCommits
        .filter((rc) => {
          const cDay =
            createdDateByRepo.get(rc.fullName.toLowerCase()) ||
            createdDateByRepo.get(rc.repoName.toLowerCase());
          return !cDay || d.date >= cDay;
        })
        .map((rc) => {
          const exactBytes =
            accurateBytesByRepo.get(rc.fullName.toLowerCase()) ??
            accurateBytesByRepo.get(rc.repoName.toLowerCase());
          return {
            ...rc,
            totalRepoBytes: exactBytes ?? rc.totalRepoBytes,
            commits: [...rc.commits],
          };
        });

      const updatedCreated = d.reposCreated.map((rc) => {
        const exactBytes =
          accurateBytesByRepo.get(rc.fullName.toLowerCase()) ??
          accurateBytesByRepo.get(rc.repoName.toLowerCase());
        return exactBytes !== undefined ? { ...rc, totalBytes: exactBytes } : { ...rc };
      });

      if (updatedCreated.length > 0 || validCommits.length > 0) {
        dayMap.set(d.date, {
          ...d,
          reposCreated: updatedCreated,
          repoCommits: validCommits,
        });
      }
    }
    for (const s of apiData.repoSummaries) {
      summaryMap.set(s.fullName.toLowerCase(), { ...s });
    }
  }

  for (const { repo, isContributed } of allClientRepos) {
    const repoOwner = repo.ownerLogin || owner;
    const fullName = repo.fullName || `${repoOwner}/${repo.name}`;
    const fullKey = fullName.toLowerCase();
    const primaryLanguage = repo.languagePercentages?.[0]?.name ?? null;
    const totalBytes = repo.totalBytes > 0 ? repo.totalBytes : (repo.size || 0) * 1024;
    const repoCreatedDay = repo.created_at ? repo.created_at.slice(0, 10) : "";

    // 1. Ensure creation date is recorded for owned repos
    if (!isContributed && repoCreatedDay) {
      const dayEntry = ensureDay(repoCreatedDay);
      const exists = dayEntry.reposCreated.some(
        (rc) => rc.fullName.toLowerCase() === fullKey || rc.repoName.toLowerCase() === repo.name.toLowerCase()
      );
      if (!exists) {
        dayEntry.reposCreated.push({
          repoName: repo.name,
          fullName,
          htmlUrl: repo.html_url,
          description: repo.description,
          createdAt: repo.created_at,
          private: repo.private,
          primaryLanguage,
          totalBytes,
          stars: repo.stargazers_count,
        });
      } else {
        // Prefer exact client language analysis bytes over diskUsage
        dayEntry.reposCreated = dayEntry.reposCreated.map((rc) =>
          rc.fullName.toLowerCase() === fullKey || rc.repoName.toLowerCase() === repo.name.toLowerCase()
            ? { ...rc, totalBytes, primaryLanguage: rc.primaryLanguage || primaryLanguage }
            : rc
        );
      }
    }

    // 2. Add commit days from advancedMetrics if the API had no commits for this repo
    const rawCommitDates = repo.advancedMetrics?.commitDates ?? [];
    const commitDates = rawCommitDates.filter(
      (d) => !repoCreatedDay || d.slice(0, 10) >= repoCreatedDay
    );
    const totalCommits =
      repo.userContribution?.commits ?? repo.advancedMetrics?.totalCommits ?? 0;

    const hasApiCommitsForRepo = Array.from(dayMap.values()).some((d) =>
      d.repoCommits.some(
        (rc) =>
          rc.fullName.toLowerCase() === fullKey ||
          (!isContributed && rc.repoName.toLowerCase() === repo.name.toLowerCase())
      )
    );

    if (!hasApiCommitsForRepo && !pendingRepos.has(fullKey) && commitDates.length > 0) {
      // commitDates holds one entry per active day, so the per-day count is a
      // lower bound. An empty `commits` list marks it as such for the UI.
      const countsByDay = new Map<string, number>();
      for (const rawDate of commitDates) {
        const dKey = rawDate.slice(0, 10);
        countsByDay.set(dKey, (countsByDay.get(dKey) ?? 0) + 1);
      }

      for (const [dKey, count] of countsByDay.entries()) {
        ensureDay(dKey).repoCommits.push({
          repoName: repo.name,
          fullName,
          ownerLogin: repoOwner,
          ownerAvatar: repo.ownerAvatar,
          htmlUrl: repo.html_url,
          isContributed,
          private: repo.private,
          primaryLanguage,
          totalRepoBytes: totalBytes,
          commitCount: count,
          additions: 0,
          deletions: 0,
          linesKnown: false,
          commits: [],
        });
      }
    }

    // 3. Ensure repo summary exists and uses accurate client bytes
    const existingSummary = summaryMap.get(fullKey);
    if (existingSummary) {
      existingSummary.currentRepoBytes = totalBytes;
      existingSummary.primaryLanguage = existingSummary.primaryLanguage || primaryLanguage;
      if (repoCreatedDay && existingSummary.firstCommitDate && existingSummary.firstCommitDate < repoCreatedDay) {
        existingSummary.firstCommitDate = repoCreatedDay;
      }
      if (totalCommits > existingSummary.totalCommits) {
        existingSummary.totalCommits = totalCommits;
      }
      if (repo.advancedMetrics?.activeDays && repo.advancedMetrics.activeDays > existingSummary.activeDays) {
        existingSummary.activeDays = repo.advancedMetrics.activeDays;
      }
    } else {
      const sortedDates = commitDates.map((d) => d.slice(0, 10)).sort();
      summaryMap.set(fullKey, {
        repoName: repo.name,
        fullName,
        htmlUrl: repo.html_url,
        isContributed,
        private: repo.private,
        primaryLanguage,
        createdAt: repo.created_at,
        firstCommitDate:
          sortedDates[0] ?? (repoCreatedDay || null),
        lastCommitDate:
          sortedDates[sortedDates.length - 1] ??
          (repo.pushed_at ? repo.pushed_at.slice(0, 10) : null),
        activeDays: Math.max(new Set(sortedDates).size, repo.advancedMetrics?.activeDays ?? 0),
        totalCommits: Math.max(totalCommits, commitDates.length),
        totalAdditions: 0,
        totalDeletions: 0,
        linesCommits: 0,
        currentRepoBytes: totalBytes,
      });
    }
  }

  // Re-compute day totals and filter out any empty days
  const days = Array.from(dayMap.values())
    .filter((d) => d.reposCreated.length > 0 || d.repoCommits.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const day of days) {
    day.repoCommits.sort(
      (a, b) =>
        b.additions + b.deletions - (a.additions + a.deletions) ||
        b.commitCount - a.commitCount
    );
    day.totalCommits = day.repoCommits.reduce((s, r) => s + r.commitCount, 0);
    day.totalAdditions = day.repoCommits.reduce((s, r) => s + r.additions, 0);
    day.totalDeletions = day.repoCommits.reduce((s, r) => s + r.deletions, 0);
  }

  const repoSummaries = Array.from(summaryMap.values()).sort(
    (a, b) => b.totalCommits - a.totalCommits || b.currentRepoBytes - a.currentRepoBytes
  );

  return {
    username: owner,
    days,
    repoSummaries,
    totals: {
      activeDays: days.length,
      reposCreated: days.reduce((s, d) => s + d.reposCreated.length, 0),
      totalCommits: repoSummaries.reduce((s, r) => s + r.totalCommits, 0),
      totalAdditions: repoSummaries.reduce((s, r) => s + r.totalAdditions, 0),
      totalDeletions: repoSummaries.reduce((s, r) => s + r.totalDeletions, 0),
      linesCommits: repoSummaries.reduce((s, r) => s + r.linesCommits, 0),
    },
    source: apiData?.source ?? "rest",
    loading: apiData?.loading ?? false,
    pendingRepos: apiData?.pendingRepos ?? [],
  };
}

export default function DailyActivityTab({
  apiData,
  loading,
  ownedRepos,
  contributedRepos,
  owner,
}: {
  apiData: UserDailyActivityResponse | null;
  loading: boolean;
  ownedRepos: RepoInfo[];
  contributedRepos: RepoInfo[] | null;
  owner: string;
}) {
  const { t, locale } = useLocale();
  const fmt = useFormat();

  const [view, setView] = useState<ViewMode>("timeline");
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [daySort, setDaySort] = useState<DaySort>("dateDesc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllDays, setShowAllDays] = useState(false);
  const [expandedDayRepos, setExpandedDayRepos] = useState<Set<string>>(new Set());

  const merged = useMemo(
    () => mergeWithClientRepos(apiData, ownedRepos, contributedRepos, owner),
    [apiData, ownedRepos, contributedRepos, owner]
  );

  const toggleCommits = (key: string) => {
    setExpandedDayRepos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const repoOptions = useMemo(() => {
    return merged.repoSummaries.map((r) => ({
      value: r.fullName,
      label: r.isContributed ? r.fullName : r.repoName,
    }));
  }, [merged.repoSummaries]);

  const filteredDays = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const out: DailyActivityEntry[] = [];
    for (const day of merged.days) {
      let reposCreated = day.reposCreated;
      let repoCommits = day.repoCommits;

      if (selectedRepo) {
        const target = selectedRepo.toLowerCase();
        reposCreated = reposCreated.filter(
          (r) => r.fullName.toLowerCase() === target || r.repoName.toLowerCase() === target
        );
        repoCommits = repoCommits.filter(
          (r) => r.fullName.toLowerCase() === target || r.repoName.toLowerCase() === target
        );
      }

      if (q) {
        reposCreated = reposCreated.filter(
          (r) =>
            r.repoName.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            (r.description?.toLowerCase().includes(q) ?? false) ||
            day.date.includes(q)
        );
        repoCommits = repoCommits.filter(
          (r) =>
            r.repoName.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            r.commits.some((c) => c.message.toLowerCase().includes(q)) ||
            day.date.includes(q)
        );
      }

      if (activityFilter === "created" && reposCreated.length === 0) continue;
      if (activityFilter === "commits" && repoCommits.length === 0) continue;
      if (reposCreated.length === 0 && repoCommits.length === 0) continue;

      out.push({
        date: day.date,
        reposCreated,
        repoCommits,
        totalCommits: repoCommits.reduce((s, r) => s + r.commitCount, 0),
        totalAdditions: repoCommits.reduce((s, r) => s + r.additions, 0),
        totalDeletions: repoCommits.reduce((s, r) => s + r.deletions, 0),
      });
    }

    switch (daySort) {
      case "dateDesc":
        return out.sort((a, b) => b.date.localeCompare(a.date));
      case "dateAsc":
        return out.sort((a, b) => a.date.localeCompare(b.date));
      case "linesDesc":
        return out.sort(
          (a, b) =>
            b.totalAdditions + b.totalDeletions - (a.totalAdditions + a.totalDeletions)
        );
      case "commitsDesc":
        return out.sort((a, b) => b.totalCommits - a.totalCommits);
    }
  }, [merged.days, selectedRepo, searchQuery, activityFilter, daySort]);

  const filteredRepoSummaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return merged.repoSummaries.filter((r) => {
      if (selectedRepo && r.fullName.toLowerCase() !== selectedRepo.toLowerCase()) {
        return false;
      }
      if (q) {
        return (
          r.repoName.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          (r.primaryLanguage?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [merged.repoSummaries, selectedRepo, searchQuery]);

  const formatFullDay = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T12:00:00Z`);
      return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Calendar days are stored as YYYY-MM-DD; read them at noon UTC so no time zone
  // shifts them onto the neighbouring day.
  const formatDay = (dateStr: string) => fmt.date(`${dateStr.slice(0, 10)}T12:00:00Z`);

  const formatTimeOnly = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return "";
    }
  };

  const signedNum = (n: number) => `${n > 0 ? "+" : n < 0 ? "-" : ""}${fmt.num(Math.abs(n))}`;

  if (loading && !apiData) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-hairline bg-panel px-3 py-2.5 text-center">
          <p className="t-caption text-muted flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
            {t("daily.loading")}
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 animate-pulse bg-surface" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 h-36 animate-pulse bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  const { totals } = merged;
  const hasLines = totals.linesCommits > 0;
  const netLines = totals.totalAdditions - totals.totalDeletions;
  const pendingRepos = new Set(merged.pendingRepos ?? []);
  const linesCaption = merged.loading
    ? t("daily.lines.loading")
        .replace("{n}", fmt.num(totals.linesCommits))
        .replace("{m}", fmt.num(totals.totalCommits))
    : hasLines
      ? t("daily.lines.coverage")
          .replace("{n}", fmt.num(totals.linesCommits))
          .replace("{m}", fmt.num(totals.totalCommits))
      : merged.source === "rest"
        ? t("daily.lines.signIn")
        : t("daily.lines.none");

  const visibleDays = showAllDays ? filteredDays : filteredDays.slice(0, INITIAL_DAYS_SHOWN);

  return (
    <div className="space-y-4">
      {/* 1. Headline Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3.5 flex flex-col justify-between">
          <span className="t-micro text-faint">{t("daily.stat.activeDays")} &amp; {t("daily.stat.reposCreated")}</span>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="t-stat text-fg">{fmt.num(totals.activeDays)}</span>
            <span className="t-caption text-muted">{t("timeline.days")}</span>
            <span className="t-caption text-accent-text font-medium ml-auto px-2 py-0.5 rounded-pill bg-accent-soft tnum">
              +{fmt.num(totals.reposCreated)} repo
            </span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <span className="t-micro text-faint">{t("daily.stat.totalCommits")}</span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="t-stat text-fg">{fmt.num(totals.totalCommits)}</span>
            <span className="t-caption text-muted tnum">
              {merged.repoSummaries.length} repo
            </span>
          </div>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <span className="t-micro text-faint">{t("daily.stat.lines")}</span>
          {hasLines ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tnum">
              <span className="text-base font-semibold text-success">
                +{fmt.num(totals.totalAdditions)}
              </span>
              <span className="text-sm font-medium text-danger">
                -{fmt.num(totals.totalDeletions)}
              </span>
            </div>
          ) : (
            <span className="mt-2 t-stat text-faint">—</span>
          )}
          <p className="t-caption text-faint tnum mt-1 flex items-center gap-1.5">
            {merged.loading && (
              <span
                className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block shrink-0"
                aria-hidden
              />
            )}
            {linesCaption}
          </p>
        </div>

        <div className="card p-3.5 flex flex-col justify-between">
          <span className="t-micro text-faint">{t("daily.stat.netLines")}</span>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`t-stat ${
                !hasLines ? "text-faint" : netLines >= 0 ? "text-accent-text" : "text-warning"
              }`}
            >
              {hasLines ? signedNum(netLines) : "—"}
            </span>
            {hasLines && <span className="t-caption text-faint">{t("daily.lines.unit")}</span>}
          </div>
        </div>
      </div>

      {/* 2. View Switcher & Filters */}
      <div className="card p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            items={[
              { id: "timeline" as ViewMode, label: `${t("daily.view.timeline")} (${filteredDays.length})` },
              { id: "repos" as ViewMode, label: `${t("daily.view.repos")} (${filteredRepoSummaries.length})` },
            ]}
            value={view}
            onChange={setView}
          />

          {selectedRepo && (
            <button
              type="button"
              onClick={() => setSelectedRepo("")}
              className="chip chip-on"
            >
              <span>{selectedRepo}</span>
              <span aria-hidden>×</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 lg:justify-end">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("repos.filter.placeholder")}
            aria-label={t("repos.filter.label")}
            className="field w-full sm:w-40"
          />

          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            aria-label={t("daily.filter.allRepos")}
            className="field w-full sm:w-44 cursor-pointer truncate"
          >
            <option value="">{t("daily.filter.allRepos")}</option>
            {repoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {view === "timeline" && (
            <>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
                aria-label={t("daily.filter.allTypes")}
                className="field w-full sm:w-40 cursor-pointer truncate"
              >
                <option value="all">{t("daily.filter.allTypes")}</option>
                <option value="created">{t("daily.filter.createdOnly")}</option>
                <option value="commits">{t("daily.filter.commitsOnly")}</option>
              </select>

              <select
                value={daySort}
                onChange={(e) => setDaySort(e.target.value as DaySort)}
                aria-label={t("repos.sortLabel")}
                className="field w-full sm:w-40 cursor-pointer truncate"
              >
                <option value="dateDesc">{t("daily.sort.dateDesc")}</option>
                <option value="dateAsc">{t("daily.sort.dateAsc")}</option>
                <option value="linesDesc">{t("daily.sort.linesDesc")}</option>
                <option value="commitsDesc">{t("daily.sort.commitsDesc")}</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* 3. Content Area */}
      {view === "timeline" ? (
        filteredDays.length === 0 ? (
          <EmptyState
            title={t("daily.empty.title")}
            body={t("daily.empty.body")}
            action={
              selectedRepo || searchQuery || activityFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRepo("");
                    setSearchQuery("");
                    setActivityFilter("all");
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  {t("action.clearFilters")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {visibleDays.map((day) => {
              const dayHasLines =
                day.repoCommits.some((rc) => rc.linesKnown) &&
                day.totalAdditions + day.totalDeletions > 0;
              const dayCountIsLowerBound = day.repoCommits.some((rc) => rc.commits.length === 0);

              return (
                <article key={day.date} className="card overflow-hidden">
                  {/* Day Header */}
                  <header className="px-4 py-3 bg-panel/70 border-b border-hairline flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                      <h3 className="t-small font-semibold text-fg">
                        <time dateTime={day.date}>{formatFullDay(day.date)}</time>
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 t-caption tnum">
                      {day.reposCreated.length > 0 && (
                        <span className="px-2 py-0.5 rounded-pill bg-accent-soft text-accent-text font-medium">
                          {day.reposCreated.length} {t("daily.badge.reposCreatedCount")}
                        </span>
                      )}
                      {day.totalCommits > 0 && (
                        <span className="px-2 py-0.5 rounded-pill bg-surface border border-hairline text-fg font-medium">
                          {fmt.num(day.totalCommits)}
                          {dayCountIsLowerBound && "+"} {t("repo.commitsShort")} · {day.repoCommits.length} repo
                        </span>
                      )}
                      {dayHasLines && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-surface border border-hairline">
                          <span className="text-success font-medium">+{fmt.num(day.totalAdditions)}</span>
                          <span className="text-danger font-medium">-{fmt.num(day.totalDeletions)}</span>
                          <span className="text-muted">{t("daily.lines.unit")}</span>
                        </span>
                      )}
                    </div>
                  </header>

                  <div className="p-4 space-y-3">
                    {/* Created Repositories on this day */}
                    {day.reposCreated.map((rc: DailyRepoCreated) => (
                      <div
                        key={`created-${rc.fullName}`}
                        className="rounded-xl border border-accent-line bg-accent-soft/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-accent text-accent-fg">
                              {t("daily.badge.repoCreated")}
                            </span>
                            <a
                              href={rc.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={rc.fullName}
                              className="t-small font-semibold font-mono text-fg hover:text-accent-text transition-colors truncate"
                            >
                              {rc.repoName}
                            </a>
                            {rc.private && (
                              <span className="t-caption px-1.5 rounded bg-panel text-faint">
                                {t("repo.private")}
                              </span>
                            )}
                            {rc.primaryLanguage && (
                              <span className="inline-flex items-center gap-1 t-caption text-muted">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: getLanguageColor(rc.primaryLanguage, 0) }}
                                />
                                {rc.primaryLanguage}
                              </span>
                            )}
                            {formatTimeOnly(rc.createdAt) && (
                              <span className="t-caption text-faint font-mono tnum">
                                {formatTimeOnly(rc.createdAt)}
                              </span>
                            )}
                          </div>
                          {rc.description && (
                            <p className="t-caption text-muted line-clamp-1">{rc.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 tnum">
                          <div className="text-right">
                            <span className="block t-micro text-faint">
                              {t("daily.repo.currentSize")}
                            </span>
                            <span className="t-small font-semibold text-fg">
                              {formatBytes(rc.totalBytes)}
                            </span>
                          </div>
                          <Link
                            href={`/repo/${rc.fullName}`}
                            className="btn btn-soft btn-sm"
                          >
                            {t("repo.deepDive")}
                          </Link>
                        </div>
                      </div>
                    ))}

                    {/* Committed Repositories on this day */}
                    {day.repoCommits.map((rc: DailyRepoCommitActivity) => {
                      const expandKey = `${day.date}:${rc.fullName}`;
                      const isExpanded = expandedDayRepos.has(expandKey);
                      const changed = rc.additions + rc.deletions;
                      const showBar = rc.linesKnown && changed > 0;
                      const addPct = showBar ? Math.round((rc.additions / changed) * 100) : 0;

                      return (
                        <div
                          key={`commits-${rc.fullName}`}
                          className="rounded-xl border border-hairline bg-surface p-3.5 space-y-2.5"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                              {rc.isContributed && rc.ownerAvatar && (
                                <Avatar
                                  src={rc.ownerAvatar}
                                  label={rc.ownerLogin}
                                  size={18}
                                  rounded="full"
                                />
                              )}
                              <a
                                href={rc.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={rc.fullName}
                                className="t-small font-semibold font-mono text-fg hover:text-accent-text transition-colors truncate"
                              >
                                {rc.isContributed ? rc.fullName : rc.repoName}
                              </a>
                              {rc.isContributed && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium leading-none bg-accent-soft text-accent-text">
                                  {t("daily.badge.contributed")}
                                </span>
                              )}
                              {rc.private && (
                                <span className="t-caption px-1.5 rounded bg-panel text-faint">
                                  {t("repo.private")}
                                </span>
                              )}
                              {rc.primaryLanguage && (
                                <span className="inline-flex items-center gap-1 t-caption text-muted">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: getLanguageColor(rc.primaryLanguage, 0) }}
                                  />
                                  {rc.primaryLanguage}
                                </span>
                              )}
                            </div>

                            {/* Commit count & line delta */}
                            <div className="flex flex-wrap items-center gap-2 t-caption tnum">
                              <span
                                className="px-2 py-0.5 rounded-md bg-accent-soft text-accent-text font-semibold"
                                title={rc.commits.length === 0 ? t("daily.repo.countLowerBound") : undefined}
                              >
                                {fmt.num(rc.commitCount)}
                                {rc.commits.length === 0 && "+"} {t("repo.commitsShort")}
                              </span>
                              {rc.linesKnown ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-panel"
                                  title={`+${fmt.num(rc.additions)} ${t("daily.repo.linesAdded")} · -${fmt.num(rc.deletions)} ${t("daily.repo.linesDeleted")}`}
                                >
                                  <span className="text-success font-medium">+{fmt.num(rc.additions)}</span>
                                  <span className="text-danger font-medium">-{fmt.num(rc.deletions)}</span>
                                  <span className="text-muted">{t("daily.lines.unit")}</span>
                                </span>
                              ) : (
                                <span className="text-faint">{t("daily.lines.none")}</span>
                              )}
                            </div>
                          </div>

                          {showBar && (
                            <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden flex" aria-hidden>
                              <div className="h-full bg-success" style={{ width: `${addPct}%` }} />
                              <div className="h-full bg-danger" style={{ width: `${100 - addPct}%` }} />
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint tnum">
                            <span>
                              {rc.totalRepoBytes > 0 && (
                                <>
                                  {t("daily.repo.currentSize")}: {formatBytes(rc.totalRepoBytes)}
                                </>
                              )}
                            </span>

                            <div className="flex items-center gap-3">
                              {rc.commits.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleCommits(expandKey)}
                                  aria-expanded={isExpanded}
                                  className="text-accent-text hover:underline font-medium cursor-pointer"
                                >
                                  {isExpanded
                                    ? t("daily.repo.hideCommits")
                                    : `${t("daily.repo.showCommits")} (${rc.commits.length})`}
                                </button>
                              )}
                              <Link
                                href={`/repo/${rc.fullName}`}
                                className="text-muted hover:text-fg transition-colors"
                              >
                                {t("repo.deepDive")} →
                              </Link>
                            </div>
                          </div>

                          {/* Expanded Commit List for this Repo on this Day */}
                          {isExpanded && rc.commits.length > 0 && (
                            <div className="mt-2 pt-2.5 border-t border-hairline space-y-1.5">
                              {rc.commits.map((c) => (
                                <div
                                  key={c.sha}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-lg bg-panel/60 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {formatTimeOnly(c.timestamp) && (
                                      <span className="text-faint font-mono tnum shrink-0">
                                        {formatTimeOnly(c.timestamp)}
                                      </span>
                                    )}
                                    <a
                                      href={c.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-accent-text hover:underline shrink-0"
                                    >
                                      {c.shortSha}
                                    </a>
                                    <span className="text-fg truncate" title={c.message}>
                                      {c.message}
                                    </span>
                                  </div>

                                  {c.additions !== null && c.deletions !== null && (
                                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tnum">
                                      <span className="text-success">+{fmt.num(c.additions)}</span>
                                      <span className="text-danger">-{fmt.num(c.deletions)}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}

            {filteredDays.length > INITIAL_DAYS_SHOWN && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAllDays((v) => !v)}
                  className="btn btn-ghost btn-sm"
                >
                  {showAllDays
                    ? t("action.showLess")
                    : `${t("action.showAll")} (${filteredDays.length})`}
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* 4. Per-Repo Summary Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-panel/60 t-micro text-faint">
                  <th className="py-3 px-4 font-medium">{t("daily.table.repo")}</th>
                  <th className="py-3 px-3 font-medium hidden md:table-cell">{t("daily.table.createdDate")}</th>
                  <th className="py-3 px-3 font-medium hidden lg:table-cell">{t("daily.table.activeSpan")}</th>
                  <th className="py-3 px-3 font-medium text-right hidden sm:table-cell">{t("daily.table.activeDays")}</th>
                  <th className="py-3 px-3 font-medium text-right">{t("daily.table.commits")}</th>
                  <th className="py-3 px-3 font-medium text-right">{t("daily.table.lines")}</th>
                  <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">{t("daily.table.currentSize")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepoSummaries.map((r) => (
                  <tr
                    key={r.fullName}
                    className="border-b border-hairline last:border-b-0 hover:bg-panel/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {r.primaryLanguage && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: getLanguageColor(r.primaryLanguage, 0) }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRepo(r.fullName);
                            setView("timeline");
                          }}
                          title={t("daily.table.filterByRepo")}
                          className="t-small font-mono font-medium text-fg hover:text-accent-text transition-colors truncate max-w-[12rem] sm:max-w-[16rem] cursor-pointer text-left"
                        >
                          {r.isContributed ? r.fullName : r.repoName}
                        </button>
                        {r.isContributed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-soft text-accent-text font-medium leading-none shrink-0">
                            {t("daily.badge.contributed")}
                          </span>
                        )}
                        {r.private && (
                          <span className="t-caption px-1.5 rounded bg-panel text-faint shrink-0">
                            {t("repo.private")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 t-caption text-muted tnum whitespace-nowrap hidden md:table-cell">
                      {r.createdAt ? formatDay(r.createdAt) : "—"}
                    </td>
                    <td className="py-3 px-3 t-caption text-muted tnum whitespace-nowrap hidden lg:table-cell">
                      {r.firstCommitDate && r.lastCommitDate ? (
                        <>
                          <span className="block">{formatDay(r.firstCommitDate)}</span>
                          <span className="block text-faint">→ {formatDay(r.lastCommitDate)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3 t-small text-right text-muted tnum hidden sm:table-cell">
                      {fmt.num(r.activeDays)}
                    </td>
                    <td className="py-3 px-3 t-small text-right font-semibold text-fg tnum">
                      {fmt.num(r.totalCommits)}
                    </td>
                    <td className="py-3 px-3 text-right tnum whitespace-nowrap">
                      {pendingRepos.has(r.fullName.toLowerCase()) ? (
                        <span className="t-caption text-faint" title={t("daily.lines.pending")}>
                          …
                        </span>
                      ) : r.linesCommits > 0 ? (
                        <>
                          <span className="block t-small text-success font-medium">
                            +{fmt.num(r.totalAdditions)}
                          </span>
                          <span className="block t-small text-danger">
                            -{fmt.num(r.totalDeletions)}
                          </span>
                          {r.linesCommits < r.totalCommits && (
                            <span className="block text-[11px] text-faint">
                              {t("daily.lines.lastN").replace("{n}", fmt.num(r.linesCommits))}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="t-caption text-faint" title={t("daily.lines.none")}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right t-small text-muted tnum whitespace-nowrap hidden sm:table-cell">
                      {formatBytes(r.currentRepoBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
