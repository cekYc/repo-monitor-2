"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";
import useFormat from "@/components/useFormat";
import type { DailyActivityEntry } from "@/lib/github";
import type { TranslationKey } from "@/lib/i18n";

type Grain = "day" | "week" | "month";

interface TrendPoint {
  key: string; // YYYY-MM-DD of the bucket's first day
  commits: number;
  added: number;
  deleted: number; // negative: drawn below the zero line
  /** Some commits here only carry a day, so the count is a lower bound. */
  countIsLowerBound: boolean;
  /** Some commits here have no line stats, so the line totals undercount. */
  linesPartial: boolean;
}

const GRAIN_LABEL: Record<Grain, TranslationKey> = {
  day: "daily.trend.grain.day",
  week: "daily.trend.grain.week",
  month: "daily.trend.grain.month",
};

const SYNC_ID = "daily-activity-trend";
const AXIS_TICK = { fill: "var(--faint)", fontSize: 11 };

const toUtc = (day: string) => new Date(`${day}T00:00:00Z`);
const toDay = (d: Date) => d.toISOString().slice(0, 10);

/** Long ranges are bucketed so the line shows a shape instead of 600 spikes. */
function pickGrain(first: string, last: string): Grain {
  const spanDays = (toUtc(last).getTime() - toUtc(first).getTime()) / 86_400_000;
  if (spanDays <= 62) return "day";
  if (spanDays <= 370) return "week";
  return "month";
}

function bucketStart(day: string, grain: Grain): string {
  if (grain === "day") return day;
  if (grain === "month") return `${day.slice(0, 7)}-01`;
  const d = toUtc(day);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
  return toDay(d);
}

function nextBucket(key: string, grain: Grain): string {
  const d = toUtc(key);
  if (grain === "day") d.setUTCDate(d.getUTCDate() + 1);
  else if (grain === "week") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return toDay(d);
}

/** Commits and lines over time, as two small charts on one time axis: commit
 *  counts and line counts differ by orders of magnitude, so they never share a
 *  y-axis. Removed lines sit below zero, so their direction reads from position
 *  and the green/red pair is never the only cue. Follows the day list it is
 *  given, so the feed's filters scope it too. */
export default function ActivityTrendChart({ days }: { days: DailyActivityEntry[] }) {
  const { t, locale } = useLocale();
  const fmt = useFormat();

  const { points, grain, firstDay, lastDay } = useMemo(() => {
    const active = days.filter((d) => d.repoCommits.length > 0);
    if (active.length === 0) {
      return { points: [] as TrendPoint[], grain: "day" as Grain, firstDay: "", lastDay: "" };
    }

    const sorted = active.map((d) => d.date).sort();
    const grain = pickGrain(sorted[0], sorted[sorted.length - 1]);

    const buckets = new Map<string, TrendPoint>();
    for (const day of active) {
      const key = bucketStart(day.date, grain);
      const point =
        buckets.get(key) ??
        { key, commits: 0, added: 0, deleted: 0, countIsLowerBound: false, linesPartial: false };
      for (const rc of day.repoCommits) {
        point.commits += rc.commitCount;
        if (rc.linesKnown) {
          point.added += rc.additions;
          point.deleted -= rc.deletions;
        } else {
          point.linesPartial = true;
        }
        if (rc.commits.length === 0) point.countIsLowerBound = true;
      }
      buckets.set(key, point);
    }

    // Quiet periods are real zeros: fill them so the line does not bridge gaps.
    const points: TrendPoint[] = [];
    const lastKey = bucketStart(sorted[sorted.length - 1], grain);
    for (let key = bucketStart(sorted[0], grain); key <= lastKey; key = nextBucket(key, grain)) {
      points.push(
        buckets.get(key) ?? {
          key,
          commits: 0,
          added: 0,
          deleted: 0,
          countIsLowerBound: false,
          linesPartial: false,
        }
      );
    }
    return { points, grain, firstDay: sorted[0], lastDay: sorted[sorted.length - 1] };
  }, [days]);

  const dateTag = locale === "tr" ? "tr-TR" : "en-US";
  const compact = useMemo(
    () => new Intl.NumberFormat(fmt.tag, { notation: "compact", maximumFractionDigits: 1 }),
    [fmt.tag]
  );
  const signedCompact = (n: number) => (n < 0 ? `-${compact.format(-n)}` : compact.format(n));

  const formatTick = (key: string) =>
    new Intl.DateTimeFormat(dateTag, {
      ...(grain === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }),
      timeZone: "UTC",
    }).format(toUtc(key));

  const formatPeriod = (key: string) => {
    const long = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(dateTag, { ...opts, timeZone: "UTC" }).format(d);
    if (grain === "day") return long(toUtc(key), { day: "numeric", month: "long", year: "numeric" });
    if (grain === "month") return long(toUtc(key), { month: "long", year: "numeric" });
    const end = toUtc(key);
    end.setUTCDate(end.getUTCDate() + 6);
    return `${long(toUtc(key), { day: "numeric", month: "short" })} – ${long(end, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  // A single bucket draws no line; the feed below already says it all.
  if (points.length < 2) return null;

  const hint = `${t(GRAIN_LABEL[grain])} · ${fmt.date(`${firstDay}T12:00:00Z`)} – ${fmt.date(
    `${lastDay}T12:00:00Z`
  )}`;

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: readonly { payload: TrendPoint }[];
  }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="pop px-3 py-2 min-w-[168px] space-y-1">
        <p className="t-caption text-muted">{formatPeriod(p.key)}</p>
        <TooltipRow
          color="var(--accent)"
          value={`${p.countIsLowerBound ? "≥" : ""}${fmt.num(p.commits)}`}
          label={t("daily.trend.commits")}
        />
        <TooltipRow color="var(--chart-add)" value={`+${fmt.num(p.added)}`} label={t("daily.trend.added")} />
        <TooltipRow color="var(--chart-del)" value={`-${fmt.num(-p.deleted)}`} label={t("daily.trend.deleted")} />
        {p.linesPartial && (
          <p className="t-caption text-faint max-w-[200px] pt-0.5">{t("daily.trend.partial")}</p>
        )}
      </div>
    );
  };

  const cursor = { stroke: "var(--hairline-strong)", strokeWidth: 1 };
  const activeDot = { r: 4, strokeWidth: 2, stroke: "var(--surface)" };

  return (
    <section className="card p-4 md:p-5">
      <SectionHeader title={t("daily.trend.title")} hint={hint} />

      {/* Commits: one series, so the label above is its legend */}
      <p className="t-micro text-faint mt-4 mb-1">{t("daily.trend.commits")}</p>
      <div className="h-[112px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* No x-axis here, so the bottom margin keeps the "0" tick from clipping */}
          <AreaChart data={points} syncId={SYNC_ID} margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis dataKey="key" hide />
            <YAxis
              width={44}
              allowDecimals={false}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={(n: number) => compact.format(n)}
            />
            {/* Synced with the chart below, which shows the one shared readout */}
            <Tooltip content={() => null} cursor={cursor} />
            <Area
              type="linear"
              dataKey="commits"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="var(--accent)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ ...activeDot, fill: "var(--accent)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lines: two series, so a legend with line keys */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 mb-1">
        <p className="t-micro text-faint">{t("daily.trend.lines")}</p>
        <div className="flex items-center gap-3 t-caption text-muted">
          <LegendKey color="var(--chart-add)" label={t("daily.trend.added")} />
          <LegendKey color="var(--chart-del)" label={t("daily.trend.deleted")} />
        </div>
      </div>
      <div className="h-[184px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} syncId={SYNC_ID} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--hairline)" />
            <XAxis
              dataKey="key"
              tickFormatter={formatTick}
              tickLine={false}
              axisLine={{ stroke: "var(--hairline)" }}
              tick={AXIS_TICK}
              minTickGap={28}
              interval="preserveStartEnd"
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickFormatter={signedCompact}
            />
            <ReferenceLine y={0} stroke="var(--hairline-strong)" />
            <Tooltip content={renderTooltip} cursor={cursor} />
            <Area
              type="linear"
              dataKey="added"
              stroke="var(--chart-add)"
              strokeWidth={2}
              fill="var(--chart-add)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ ...activeDot, fill: "var(--chart-add)" }}
              isAnimationActive={false}
            />
            <Area
              type="linear"
              dataKey="deleted"
              stroke="var(--chart-del)"
              strokeWidth={2}
              fill="var(--chart-del)"
              fillOpacity={0.1}
              dot={false}
              activeDot={{ ...activeDot, fill: "var(--chart-del)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-0.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}

/** Value first and strong, series name after: the reader already knows the
 *  series and came for the number. */
function TooltipRow({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <p className="flex items-center gap-2 t-caption">
      <span className="w-3 h-0.5 rounded-full shrink-0" style={{ background: color }} aria-hidden />
      <span className="text-fg font-semibold tnum">{value}</span>
      <span className="text-muted">{label}</span>
    </p>
  );
}
