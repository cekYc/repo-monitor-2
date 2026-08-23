"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GitHubAvatar from "@/components/GitHubAvatar";
import { useLocale } from "@/components/LocaleProvider";
import {
  calculateDeveloperCharacteristics,
  type DeveloperCharacteristics,
  type TechnicalDomain,
} from "@/lib/comparison";
import type { UserAnalysis } from "@/lib/github";
import type { TranslationKey } from "@/lib/i18n";
import { formatBytes, getLanguageColor } from "@/lib/utils";

interface UserCompareProps {
  userA: UserAnalysis;
  userB: UserAnalysis;
}

interface CharacterMetric {
  label: string;
  valueA: string;
  valueB: string;
  note?: string;
}

interface CharacteristicCardProps {
  title: string;
  description: string;
  insight: string;
  loginA: string;
  loginB: string;
  scoreA: number;
  scoreB: number;
  metrics: CharacterMetric[];
  signalLabel: string;
  children?: ReactNode;
}

type Translate = (key: TranslationKey) => string;

const DOMAIN_COLORS: Record<TechnicalDomain, string> = {
  systems: "#0891b2",
  web: "#6366f1",
  data: "#f59e0b",
  other: "#a1a1aa",
};

function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

function formatNumber(value: number, locale: "tr" | "en", digits = 1): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCompact(value: number, locale: "tr" | "en"): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number, locale: "tr" | "en"): string {
  return `${formatNumber(value, locale)}%`;
}

function formatDuration(days: number, locale: "tr" | "en"): string {
  if (days >= 365) {
    return `${formatNumber(days / 365, locale)} ${locale === "tr" ? "yıl" : "yr"}`;
  }
  if (days >= 30) {
    return `${formatNumber(days / 30, locale)} ${locale === "tr" ? "ay" : "mo"}`;
  }
  return `${formatNumber(days, locale, 0)} ${locale === "tr" ? "gün" : "days"}`;
}

function getTraitLabels(
  characteristics: DeveloperCharacteristics,
  t: Translate
): string[] {
  const breadth = characteristics.breadth.score >= 70
    ? t("compare.trait.breadthHigh")
    : characteristics.breadth.score >= 40
      ? t("compare.trait.breadthMid")
      : t("compare.trait.breadthLow");
  const depth = characteristics.depth.score >= 65
    ? t("compare.trait.depthHigh")
    : characteristics.depth.score >= 35
      ? t("compare.trait.depthMid")
      : t("compare.trait.depthLow");
  const community = characteristics.community.score >= 65
    ? t("compare.trait.communityHigh")
    : characteristics.community.score >= 30
      ? t("compare.trait.communityMid")
      : t("compare.trait.communityLow");
  const focus = characteristics.focus.score >= 80
    ? t("compare.trait.focusHigh")
    : characteristics.focus.score >= 60
      ? t("compare.trait.focusMid")
      : t("compare.trait.focusLow");
  return [breadth, depth, community, focus];
}

function getDimensionInsight(
  scoreA: number,
  scoreB: number,
  loginA: string,
  loginB: string,
  similarKey: TranslationKey,
  moreKey: TranslationKey,
  t: Translate
): string {
  if (Math.abs(scoreA - scoreB) < 8) return t(similarKey);
  const user = scoreA > scoreB ? `@${loginA}` : `@${loginB}`;
  const other = scoreA > scoreB ? `@${loginB}` : `@${loginA}`;
  return fillTemplate(t(moreKey), { user, other });
}

function SignalBar({
  login,
  score,
  color,
}: {
  login: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate text-muted">@{login}</span>
        <span className="tnum font-mono text-fg">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function CharacteristicCard({
  title,
  description,
  insight,
  loginA,
  loginB,
  scoreA,
  scoreB,
  metrics,
  signalLabel,
  children,
}: CharacteristicCardProps) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          </div>
          <span className="shrink-0 rounded-full border border-hairline bg-panel px-2 py-1 text-[10px] text-faint">
            {signalLabel}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-panel px-3 py-2.5 text-xs leading-relaxed text-fg">
          {insight}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <SignalBar login={loginA} score={scoreA} color="#6366f1" />
        <SignalBar login={loginB} score={scoreB} color="#a855f7" />
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(72px,1fr)_minmax(72px,1fr)] bg-panel px-3 py-2 text-[10px] font-medium text-faint">
          <span />
          <span className="truncate text-right">@{loginA}</span>
          <span className="truncate text-right">@{loginB}</span>
        </div>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="grid grid-cols-[minmax(0,1.2fr)_minmax(72px,1fr)_minmax(72px,1fr)] items-center border-t border-hairline px-3 py-2.5 text-xs"
          >
            <span className="pr-2 text-muted" title={metric.note}>
              {metric.label}
              {metric.note ? <span className="ml-1 text-faint">ⓘ</span> : null}
            </span>
            <span className="tnum min-w-0 break-words text-right font-mono text-indigo-600 dark:text-indigo-400">
              {metric.valueA}
            </span>
            <span className="tnum min-w-0 break-words text-right font-mono text-purple-600 dark:text-purple-400">
              {metric.valueB}
            </span>
          </div>
        ))}
      </div>
      {children}
    </section>
  );
}

function DomainDistribution({
  loginA,
  loginB,
  distributionA,
  distributionB,
  t,
}: {
  loginA: string;
  loginB: string;
  distributionA: Record<TechnicalDomain, number>;
  distributionB: Record<TechnicalDomain, number>;
  t: Translate;
}) {
  const domains: TechnicalDomain[] = ["systems", "web", "data", "other"];
  return (
    <div className="mt-4 border-t border-hairline pt-4">
      <p className="mb-3 text-[11px] font-medium text-muted">
        {t("compare.metric.domainMix")}
      </p>
      <div className="space-y-3">
        {[
          { login: loginA, distribution: distributionA },
          { login: loginB, distribution: distributionB },
        ].map(({ login, distribution }) => (
          <div key={login}>
            <div className="mb-1 flex items-center justify-between text-[10px] text-faint">
              <span>@{login}</span>
              <span className="tnum">
                S {Math.round(distribution.systems)} · W {Math.round(distribution.web)} · D {Math.round(distribution.data)}
              </span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-panel">
              {domains.map((domain) => (
                <span
                  key={domain}
                  style={{
                    width: `${distribution[domain]}%`,
                    backgroundColor: DOMAIN_COLORS[domain],
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {domains.map((domain) => (
          <span key={domain} className="inline-flex items-center gap-1.5 text-[10px] text-faint">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
            {t(`compare.metric.${domain}` as TranslationKey)}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-faint">
        {t("compare.metric.domainMixNote")}
      </p>
    </div>
  );
}

export default function UserCompare({ userA, userB }: UserCompareProps) {
  const { t, locale } = useLocale();
  const compareRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const characteristicsA = calculateDeveloperCharacteristics(userA);
  const characteristicsB = calculateDeveloperCharacteristics(userB);
  const loginA = userA.user.login;
  const loginB = userB.user.login;

  const handleExportPng = useCallback(async () => {
    if (!compareRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(compareRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#fbfbfc",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `compare-${loginA}-vs-${loginB}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Compare PNG export failed:", error);
    } finally {
      setExporting(false);
    }
  }, [loginA, loginB]);

  const langsA = new Set(userA.overallLanguages.map((language) => language.name));
  const langsB = new Set(userB.overallLanguages.map((language) => language.name));
  const shared = [...langsA].filter((language) => langsB.has(language));
  const uniqueA = [...langsA].filter((language) => !langsB.has(language));
  const uniqueB = [...langsB].filter((language) => !langsA.has(language));
  const allLanguages = new Set([...langsA, ...langsB]);
  const languageChartData = [...allLanguages]
    .map((language) => ({
      name: language,
      userA: userA.overallLanguages.find((item) => item.name === language)?.value ?? 0,
      userB: userB.overallLanguages.find((item) => item.name === language)?.value ?? 0,
    }))
    .sort((a, b) => Math.max(b.userA, b.userB) - Math.max(a.userA, a.userB))
    .slice(0, 15);

  const radarData = [
    { dimension: t("compare.dimension.breadth"), userA: characteristicsA.breadth.score, userB: characteristicsB.breadth.score },
    { dimension: t("compare.dimension.depth"), userA: characteristicsA.depth.score, userB: characteristicsB.depth.score },
    { dimension: t("compare.dimension.community"), userA: characteristicsA.community.score, userB: characteristicsB.community.score },
    { dimension: t("compare.dimension.focus"), userA: characteristicsA.focus.score, userB: characteristicsB.focus.score },
  ];

  const insights = {
    breadth: getDimensionInsight(characteristicsA.breadth.score, characteristicsB.breadth.score, loginA, loginB, "compare.insight.breadthSimilar", "compare.insight.breadthMore", t),
    depth: getDimensionInsight(characteristicsA.depth.score, characteristicsB.depth.score, loginA, loginB, "compare.insight.depthSimilar", "compare.insight.depthMore", t),
    community: getDimensionInsight(characteristicsA.community.score, characteristicsB.community.score, loginA, loginB, "compare.insight.communitySimilar", "compare.insight.communityMore", t),
    focus: getDimensionInsight(characteristicsA.focus.score, characteristicsB.focus.score, loginA, loginB, "compare.insight.focusSimilar", "compare.insight.focusMore", t),
  };

  const tooltipStyle = {
    borderRadius: "12px",
    border: "1px solid var(--hairline)",
    backgroundColor: "var(--surface)",
    color: "var(--fg)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };

  return (
    <div className="space-y-6" ref={compareRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-fg">{t("compare.character.title")}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">{t("compare.character.subtitle")}</p>
        </div>
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="shrink-0 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-text transition-colors hover:bg-panel disabled:opacity-50"
        >
          {exporting ? "…" : t("compare.exportPng")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { analysis: userA, characteristics: characteristicsA, tone: "indigo" },
          { analysis: userB, characteristics: characteristicsB, tone: "purple" },
        ].map(({ analysis, characteristics, tone }) => (
          <section
            key={analysis.user.login}
            className={`rounded-2xl border p-5 ${
              tone === "indigo"
                ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20"
                : "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <GitHubAvatar
                src={analysis.user.avatar_url}
                alt={analysis.user.login}
                identity={analysis.user.login}
                width={52}
                height={52}
                className="h-13 w-13 rounded-2xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-fg">
                  {analysis.user.name || analysis.user.login}
                </p>
                <a
                  href={analysis.user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted transition-colors hover:text-accent-text"
                >
                  @{analysis.user.login}
                </a>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {getTraitLabels(characteristics, t).map((trait) => (
                <span key={trait} className="rounded-full border border-hairline bg-surface/80 px-2 py-1 text-[11px] text-muted">
                  {trait}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-black/5 pt-4 text-center dark:border-white/5">
              <div>
                <p className="tnum text-sm font-semibold text-fg">{analysis.totalRepos}</p>
                <p className="mt-0.5 text-[10px] text-faint">{t("compare.totalRepos")}</p>
              </div>
              <div>
                <p className="tnum text-sm font-semibold text-fg">{formatBytes(analysis.totalBytes)}</p>
                <p className="mt-0.5 text-[10px] text-faint">{t("compare.totalCode")}</p>
              </div>
              <div>
                <p className="tnum text-sm font-semibold text-fg">{formatCompact(analysis.user.followers, locale)}</p>
                <p className="mt-0.5 text-[10px] text-faint">{t("compare.metric.followers")}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-hairline bg-surface p-5 lg:grid-cols-[minmax(240px,0.7fr)_minmax(420px,1.3fr)] lg:p-6">
        <div className="flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-fg">{t("compare.character.mapTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("compare.character.mapDesc")}</p>
          <div className="mt-5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              @{loginA}
            </div>
            <div className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              @{loginB}
            </div>
          </div>
        </div>
        <div className="h-[360px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--hairline-strong)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <PolarRadiusAxis angle={45} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={loginA} dataKey="userA" stroke="#6366f1" fill="#6366f1" fillOpacity={0.18} strokeWidth={2} />
              <Radar name={loginB} dataKey="userB" stroke="#a855f7" fill="#a855f7" fillOpacity={0.14} strokeWidth={2} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CharacteristicCard
          title={t("compare.dimension.breadth")}
          description={t("compare.dimension.breadthDesc")}
          insight={insights.breadth}
          loginA={loginA}
          loginB={loginB}
          scoreA={characteristicsA.breadth.score}
          scoreB={characteristicsB.breadth.score}
          signalLabel={t("compare.character.signal")}
          metrics={[
            {
              label: t("compare.metric.languageDiversity"),
              valueA: `${formatNumber(characteristicsA.breadth.effectiveLanguages, locale)} / ${characteristicsA.breadth.languageCount}`,
              valueB: `${formatNumber(characteristicsB.breadth.effectiveLanguages, locale)} / ${characteristicsB.breadth.languageCount}`,
              note: t("compare.metric.effectiveLanguages"),
            },
            {
              label: t("compare.metric.ecosystemDiversity"),
              valueA: `${characteristicsA.breadth.ecosystemDiversity}`,
              valueB: `${characteristicsB.breadth.ecosystemDiversity}`,
              note: t("compare.metric.activeEcosystems"),
            },
          ]}
        >
          <DomainDistribution
            loginA={loginA}
            loginB={loginB}
            distributionA={characteristicsA.breadth.domainDistribution}
            distributionB={characteristicsB.breadth.domainDistribution}
            t={t}
          />
        </CharacteristicCard>

        <CharacteristicCard
          title={t("compare.dimension.depth")}
          description={t("compare.dimension.depthDesc")}
          insight={insights.depth}
          loginA={loginA}
          loginB={loginB}
          scoreA={characteristicsA.depth.score}
          scoreB={characteristicsB.depth.score}
          signalLabel={t("compare.character.signal")}
          metrics={[
            { label: t("compare.metric.codePerRepo"), valueA: formatBytes(characteristicsA.depth.codePerRepo), valueB: formatBytes(characteristicsB.depth.codePerRepo) },
            { label: t("compare.metric.activeDevelopment"), valueA: formatDuration(characteristicsA.depth.activeDevelopmentDays, locale), valueB: formatDuration(characteristicsB.depth.activeDevelopmentDays, locale), note: t("compare.metric.activeDevelopmentNote") },
            { label: t("compare.metric.commitSpan"), valueA: formatDuration(characteristicsA.depth.commitSpanDays, locale), valueB: formatDuration(characteristicsB.depth.commitSpanDays, locale) },
            { label: t("compare.metric.longTermRevisit"), valueA: formatPercent(characteristicsA.depth.longTermRevisitRate, locale), valueB: formatPercent(characteristicsB.depth.longTermRevisitRate, locale) },
            { label: t("compare.metric.historyCoverage"), valueA: formatPercent(characteristicsA.depth.historyCoverage, locale), valueB: formatPercent(characteristicsB.depth.historyCoverage, locale), note: t("compare.metric.commitNote") },
          ]}
        />

        <CharacteristicCard
          title={t("compare.dimension.community")}
          description={t("compare.dimension.communityDesc")}
          insight={insights.community}
          loginA={loginA}
          loginB={loginB}
          scoreA={characteristicsA.community.score}
          scoreB={characteristicsB.community.score}
          signalLabel={t("compare.character.signal")}
          metrics={[
            { label: t("compare.metric.starsPerRepo"), valueA: formatNumber(characteristicsA.community.starsPerRepo, locale), valueB: formatNumber(characteristicsB.community.starsPerRepo, locale) },
            { label: t("compare.metric.forksPerRepo"), valueA: formatNumber(characteristicsA.community.forksPerRepo, locale), valueB: formatNumber(characteristicsB.community.forksPerRepo, locale) },
            { label: t("compare.metric.followers"), valueA: formatCompact(characteristicsA.community.followers, locale), valueB: formatCompact(characteristicsB.community.followers, locale) },
            { label: t("compare.metric.externalAdoption"), valueA: formatPercent(characteristicsA.community.externalAdoptionRate, locale), valueB: formatPercent(characteristicsB.community.externalAdoptionRate, locale), note: t("compare.metric.externalAdoptionNote") },
          ]}
        />

        <CharacteristicCard
          title={t("compare.dimension.focus")}
          description={t("compare.dimension.focusDesc")}
          insight={insights.focus}
          loginA={loginA}
          loginB={loginB}
          scoreA={characteristicsA.focus.score}
          scoreB={characteristicsB.focus.score}
          signalLabel={t("compare.character.signal")}
          metrics={[
            { label: t("compare.metric.top1Share"), valueA: formatPercent(characteristicsA.focus.top1Share, locale), valueB: formatPercent(characteristicsB.focus.top1Share, locale) },
            { label: t("compare.metric.top3Share"), valueA: formatPercent(characteristicsA.focus.top3Share, locale), valueB: formatPercent(characteristicsB.focus.top3Share, locale) },
            { label: t("compare.metric.coreLanguages"), valueA: characteristicsA.focus.topLanguages.map((language) => language.name).join(" · ") || "—", valueB: characteristicsB.focus.topLanguages.map((language) => language.name).join(" · ") || "—" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <h3 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
            {t("compare.sharedLangs")} ({shared.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {shared.map((language, index) => (
              <span key={language} className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-surface px-2 py-1 text-xs text-fg dark:border-green-900">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getLanguageColor(language, index) }} />
                {language}
              </span>
            ))}
          </div>
        </section>

        {[
          { login: loginA, languages: uniqueA, tone: "indigo" },
          { login: loginB, languages: uniqueB, tone: "purple" },
        ].map(({ login, languages, tone }) => (
          <section
            key={login}
            className={`rounded-xl border p-4 ${
              tone === "indigo"
                ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20"
                : "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20"
            }`}
          >
            <h3 className={`mb-2 text-sm font-semibold ${tone === "indigo" ? "text-indigo-700 dark:text-indigo-400" : "text-purple-700 dark:text-purple-400"}`}>
              @{login} · {t("compare.uniqueLangs")} ({languages.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {languages.length === 0 ? <span className="text-xs text-faint">—</span> : languages.map((language, index) => (
                <span key={language} className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2 py-1 text-xs text-fg">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getLanguageColor(language, index) }} />
                  {language}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-hairline bg-surface p-5 md:p-6">
        <h3 className="text-sm font-semibold text-fg">{t("compare.langDistribution")}</h3>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={Math.max(400, languageChartData.length * 40)}>
            <BarChart data={languageChartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `${value}%`} fontSize={11} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => [`${value}%`, ""]} contentStyle={tooltipStyle} />
              <Legend />
              <Bar name={loginA} dataKey="userA" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar name={loginB} dataKey="userB" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
