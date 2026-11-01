"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SectionHeader } from "@/components/ui/Card";
import Segmented from "@/components/ui/Segmented";
import { useLocale } from "@/components/LocaleProvider";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

export type VisibilityFilter = "all" | "public" | "private";

interface Lang {
  name: string;
  value: number;
  bytes: number;
}

const TABLE_PREVIEW = 6;
const PIE_SLICES = 8;

/** Level 2 of the hierarchy: the language DNA — one donut beside a short table
 *  whose rows carry their own bars, so each share is drawn once. The table
 *  stays short on purpose; the full list is one click away rather than 30 rows
 *  deep. */
export default function LanguageDna({
  languages: initialLanguages,
  repos,
}: {
  languages: Lang[];
  repos?: RepoInfo[];
}) {
  const { t } = useLocale();
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const languages = useMemo(() => {
    if (!repos || visibility === "all") return initialLanguages;

    const filtered = repos.filter((r) =>
      visibility === "public" ? !r.private : r.private
    );

    const bytesByLang: Record<string, number> = {};
    let total = 0;
    for (const repo of filtered) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        bytesByLang[lang] = (bytesByLang[lang] ?? 0) + bytes;
        total += bytes;
      }
    }

    return Object.entries(bytesByLang)
      .map(([name, bytes]) => ({
        name,
        value: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
        bytes,
      }))
      .sort((a, b) => b.bytes - a.bytes);
  }, [repos, initialLanguages, visibility]);

  const pieData = useMemo(() => {
    const top = languages.slice(0, PIE_SLICES);
    const restValue = languages.slice(PIE_SLICES).reduce((s, l) => s + l.value, 0);
    const restBytes = languages.slice(PIE_SLICES).reduce((s, l) => s + l.bytes, 0);
    return restValue > 0.05
      ? [...top, { name: t("stats.other"), value: Math.round(restValue * 100) / 100, bytes: restBytes }]
      : top;
  }, [languages, t]);

  const filterControl = (
    <div className="flex items-center gap-2">
      <select
        value={visibility}
        onChange={(e) => {
          setVisibility(e.target.value as VisibilityFilter);
          setShowAll(false);
        }}
        aria-label={t("repos.visibility.label")}
        className="field sm:hidden w-auto cursor-pointer text-xs h-8 py-1 px-2.5"
      >
        <option value="all">{t("repos.visibility.all")}</option>
        <option value="public">{t("repos.visibility.public")}</option>
        <option value="private">{t("repos.visibility.private")}</option>
      </select>

      <Segmented
        items={[
          { id: "all", label: t("repos.visibility.all") },
          { id: "public", label: t("repos.visibility.public") },
          { id: "private", label: t("repos.visibility.private") },
        ]}
        value={visibility}
        onChange={(val) => {
          setVisibility(val);
          setShowAll(false);
        }}
        className="hidden sm:inline-flex"
      />
    </div>
  );

  if (languages.length === 0) {
    return (
      <section className="card p-4 md:p-5">
        <SectionHeader
          title={t("stats.distribution.title")}
          count={`0 ${t("stats.language")}`}
          right={filterControl}
        />
        <p className="t-caption text-faint mt-3">{t("stats.noLanguages")}</p>
      </section>
    );
  }

  const rows = showAll ? languages : languages.slice(0, TABLE_PREVIEW);
  const topValue = Math.max(languages[0]?.value ?? 0, 0.01);

  return (
    <section className="card p-4 md:p-5">
      <SectionHeader
        title={t("stats.distribution.title")}
        count={`${languages.length} ${t("stats.language")}`}
        right={filterControl}
      />

      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 mt-4 items-start">
        {/* Donut */}
        <div className="h-[220px] max-w-[260px] w-full mx-auto">
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

        {/* Short table with inline bars */}
        <div className="min-w-0">
          <table className="w-full">
            <thead>
              <tr className="t-micro text-faint">
                <th className="text-left font-medium pb-1.5">{t("stats.table.lang")}</th>
                <th className="hidden sm:table-cell pb-1.5" aria-hidden />
                <th className="text-right font-medium pb-1.5 w-20">{t("stats.table.percent")}</th>
                <th className="text-right font-medium pb-1.5 w-24">{t("stats.table.size")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l, i) => (
                <tr key={l.name} className="border-t border-hairline">
                  <td className="py-1.5 pr-3 w-36">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: getLanguageColor(l.name, i) }}
                      />
                      <span className="t-small text-fg truncate">{l.name}</span>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell py-1.5" aria-hidden>
                    <span className="block h-1.5 rounded-full bg-panel overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max((l.value / topValue) * 100, 1)}%`,
                          background: getLanguageColor(l.name, i),
                        }}
                      />
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
