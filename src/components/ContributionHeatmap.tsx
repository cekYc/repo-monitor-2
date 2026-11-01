"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";

interface DayData {
  date: string;
  count: number;
}

interface ContributionHeatmapProps {
  username: string;
  token: string;
}

const MONTH_LABELS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS_TR = ["Pzt", "Çar", "Cum"];
const DAY_LABELS_EN = ["Mon", "Wed", "Fri"];

export default function ContributionHeatmap({ username, token }: ContributionHeatmapProps) {
  const { t, locale } = useLocale();
  const [days, setDays] = useState<DayData[]>([]);
  const [maxCount, setMaxCount] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [prevUsername, setPrevUsername] = useState("");

  const monthLabels = locale === "tr" ? MONTH_LABELS_TR : MONTH_LABELS_EN;
  const dayLabels = locale === "tr" ? DAY_LABELS_TR : DAY_LABELS_EN;

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ username });
      if (token) params.set("token", token);
      const res = await fetch(`/api/contributions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days || []);
        setMaxCount(data.maxCount || 1);
        setTotalEvents(data.totalEvents || 0);
        setSource(data.source || "events");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [username, token]);

  useEffect(() => {
    if (username && username !== prevUsername) {
      setPrevUsername(username);
      setLoaded(false);
    }
  }, [username, prevUsername]);

  useEffect(() => {
    if (!loaded && username) {
      const timeout = setTimeout(fetchContributions, 0);
      return () => clearTimeout(timeout);
    }
  }, [fetchContributions, loaded, username]);

  const getColor = (count: number): string => {
    if (count === 0) return "bg-panel";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "bg-green-600 dark:bg-green-500";
    if (intensity > 0.5) return "bg-green-500 dark:bg-green-600";
    if (intensity > 0.25) return "bg-green-400 dark:bg-green-700";
    return "bg-green-200 dark:bg-green-900";
  };

  // Build weeks grid (columns = weeks, rows = days of week)
  const buildGrid = (): (DayData | null)[][] => {
    if (days.length === 0) return [];
    const weeks: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = [];

    // Fill initial padding (first day might not be Monday)
    const firstDate = new Date(days[0].date);
    const firstDow = (firstDate.getDay() + 6) % 7; // Monday = 0
    for (let i = 0; i < firstDow; i++) {
      currentWeek.push(null);
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  };

  const weeks = buildGrid();
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  // Month headers
  const getMonthHeaders = () => {
    if (days.length === 0) return [];
    const headers: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIdx) => {
      for (const day of week) {
        if (day) {
          const d = new Date(day.date);
          const month = d.getMonth();
          if (month !== lastMonth) {
            headers.push({ label: monthLabels[month], weekIndex: weekIdx });
            lastMonth = month;
          }
          break;
        }
      }
    });
    return headers;
  };

  // A month that starts in the last two columns before the next one has no room
  // for its label; dropping it keeps "Kas" and "Ara" from printing over each other.
  const monthHeaders = getMonthHeaders().filter(
    (mh, i, all) => i === all.length - 1 || all[i + 1].weekIndex - mh.weekIndex >= 3
  );
  const monthAtWeek = new Map(monthHeaders.map((mh) => [mh.weekIndex, mh.label]));

  if (loading) {
    return (
      <div className="card p-4 md:p-5">
        <h2 className="t-title text-fg mb-4">{t("heatmap.title")}</h2>
        <div className="text-center py-6 t-small text-faint">
          <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t("heatmap.loading")}
        </div>
      </div>
    );
  }

  if (loaded && days.length === 0) {
    return (
      <div className="card p-4 md:p-5">
        <h2 className="t-title text-fg mb-4">{t("heatmap.title")}</h2>
        <p className="t-small text-faint text-center py-4">{t("heatmap.noData")}</p>
      </div>
    );
  }

  if (!loaded) return null;

  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="t-title text-fg">{t("heatmap.title")}</h2>
        <div className="flex items-center gap-3">
          {source === "events" && (
            <span className="t-caption text-warning" title={t("heatmap.eventsNote")}>
              {t("heatmap.eventsOnly")}
            </span>
          )}
          <span className="t-small text-faint tnum">
            {totalEvents} {t("heatmap.events")}
          </span>
        </div>
      </div>

      {/* The grid stretches to the card width; below ~560px it scrolls instead of
          shrinking the cells into specks. */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `28px repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {/* Month labels */}
            <div />
            {weeks.map((_, wi) => (
              <div key={`m-${wi}`} className="relative h-4">
                {monthAtWeek.has(wi) && (
                  <span className="absolute left-0 top-0 t-caption text-faint whitespace-nowrap">
                    {monthAtWeek.get(wi)}
                  </span>
                )}
              </div>
            ))}

            {/* One row per weekday: label, then that weekday across every week */}
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
              <Fragment key={dow}>
                <div className="text-[10px] leading-none text-faint self-center text-right pr-1">
                  {dow === 0 ? dayLabels[0] : dow === 2 ? dayLabels[1] : dow === 4 ? dayLabels[2] : ""}
                </div>
                {weeks.map((week, wi) => {
                  const day = week[dow];
                  return (
                    <div
                      key={`${wi}-${dow}`}
                      className={`aspect-square rounded-[3px] ${day ? getColor(day.count) : ""} transition-colors`}
                      title={day ? `${new Date(day.date).toLocaleDateString(dateLocale)} — ${day.count} ${t("heatmap.events")}` : undefined}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-[10px] text-faint mr-1">{t("heatmap.less")}</span>
            <div className="w-3 h-3 rounded-[3px] bg-panel" />
            <div className="w-3 h-3 rounded-[3px] bg-green-200 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-[3px] bg-green-400 dark:bg-green-700" />
            <div className="w-3 h-3 rounded-[3px] bg-green-500 dark:bg-green-600" />
            <div className="w-3 h-3 rounded-[3px] bg-green-600 dark:bg-green-500" />
            <span className="text-[10px] text-faint ml-1">{t("heatmap.more")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
