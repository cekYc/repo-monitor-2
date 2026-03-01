"use client";

import { useState, useEffect, useCallback } from "react";
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
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
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

  const monthHeaders = getMonthHeaders();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("heatmap.title")}</h2>
        <div className="text-center py-6 text-gray-400 text-sm">
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("heatmap.title")}</h2>
        <p className="text-gray-400 text-sm text-center py-4">{t("heatmap.noData")}</p>
      </div>
    );
  }

  if (!loaded) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("heatmap.title")}</h2>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {totalEvents} {t("heatmap.events")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthHeaders.map((mh, i) => (
              <div
                key={`${mh.label}-${i}`}
                className="text-xs text-gray-400 dark:text-gray-500"
                style={{ position: "relative", left: `${mh.weekIndex * 14}px`, width: 0, whiteSpace: "nowrap" }}
              >
                {mh.label}
              </div>
            ))}
          </div>

          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1 justify-between py-[2px]">
              {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                <div key={dow} className="h-[12px] text-[9px] text-gray-400 dark:text-gray-500 leading-[12px] w-6 text-right pr-1">
                  {dow === 0 ? dayLabels[0] : dow === 2 ? dayLabels[1] : dow === 4 ? dayLabels[2] : ""}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    className={`w-[12px] h-[12px] rounded-sm ${day ? getColor(day.count) : "bg-transparent"} transition-colors`}
                    title={day ? `${new Date(day.date).toLocaleDateString(dateLocale)} — ${day.count} ${t("heatmap.events")}` : ""}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mr-1">{t("heatmap.less")}</span>
            <div className="w-[12px] h-[12px] rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-400 dark:bg-green-700" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-500 dark:bg-green-600" />
            <div className="w-[12px] h-[12px] rounded-sm bg-green-600 dark:bg-green-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">{t("heatmap.more")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
