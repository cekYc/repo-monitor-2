"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/ui/Card";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes, getLanguageColor } from "@/lib/utils";

interface Lang {
  name: string;
  value: number;
  bytes: number;
}

const TABLE_PREVIEW = 6;
const PIE_SLICES = 8;

/** Level 2 of the hierarchy: the language DNA — one donut, one bar chart and a
 *  short table. The table stays short on purpose; the full list is one click
 *  away rather than 30 rows deep. */
export default function LanguageDna({ languages }: { languages: Lang[] }) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);

  const pieData = useMemo(() => {
    const top = languages.slice(0, PIE_SLICES);
    const restValue = languages.slice(PIE_SLICES).reduce((s, l) => s + l.value, 0);
    const restBytes = languages.slice(PIE_SLICES).reduce((s, l) => s + l.bytes, 0);
    return restValue > 0.05
      ? [...top, { name: t("stats.other"), value: Math.round(restValue * 100) / 100, bytes: restBytes }]
      : top;
  }, [languages, t]);

  const barData = useMemo(() => languages.slice(0, PIE_SLICES), [languages]);

  if (languages.length === 0) {
    return (
      <section className="card p-4">
        <SectionHeader title={t("stats.distribution.title")} />
        <p className="t-caption text-faint mt-3">{t("stats.noLanguages")}</p>
      </section>
    );
  }

  const rows = showAll ? languages : languages.slice(0, TABLE_PREVIEW);

  return (
    <section className="card p-4 md:p-5">
      <SectionHeader
        title={t("stats.distribution.title")}
        count={`${languages.length} ${t("stats.language")}`}
      />

      <div className="grid lg:grid-cols-2 gap-5 mt-4">
        {/* Donut */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === t("stats.other")
                        ? "var(--faint)"
                        : getLanguageColor(entry.name, i)
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bars */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--panel)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={11}>
                {barData.map((entry, i) => (
                  <Cell key={entry.name} fill={getLanguageColor(entry.name, i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Short table */}
      <div className="mt-4 pt-4 border-t border-hairline">
        <table className="w-full">
          <thead>
            <tr className="t-micro text-faint">
              <th className="text-left font-medium pb-1.5">{t("stats.table.lang")}</th>
              <th className="text-right font-medium pb-1.5 w-20">{t("stats.table.percent")}</th>
              <th className="text-right font-medium pb-1.5 w-24">{t("stats.table.size")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => (
              <tr key={l.name} className="border-t border-hairline">
                <td className="py-1.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: getLanguageColor(l.name, i) }}
                    />
                    <span className="t-small text-fg truncate">{l.name}</span>
                  </span>
                </td>
                <td className="py-1.5 text-right t-small text-muted tnum">{l.value}%</td>
                <td className="py-1.5 text-right t-caption text-faint tnum">
                  {formatBytes(l.bytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {languages.length > TABLE_PREVIEW && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="btn btn-ghost btn-sm mt-3"
          >
            {showAll
              ? t("action.showLess")
              : `${t("action.showAll")} (${languages.length})`}
          </button>
        )}
      </div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Lang }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="pop px-2.5 py-1.5">
      <p className="t-caption text-fg font-medium">{item.name}</p>
      <p className="t-caption text-muted tnum">
        {item.value}% · {formatBytes(item.bytes)}
      </p>
    </div>
  );
}
