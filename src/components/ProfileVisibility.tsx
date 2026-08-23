"use client";

import { useMemo } from "react";
import type { UserAnalysis } from "@/lib/github";
import { calculateProfileVisibility } from "@/lib/profile-visibility";
import { formatBytes, getLanguageColor } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";
import SegmentBar from "@/components/SegmentBar";

interface ProfileVisibilityProps {
  analysis: UserAnalysis;
}

function LanguageList({
  languages,
  emptyLabel,
}: {
  languages: { name: string; value: number }[];
  emptyLabel: string;
}) {
  if (languages.length === 0) {
    return <span className="text-xs text-faint">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.slice(0, 5).map((language, index) => (
        <span
          key={language.name}
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2 py-1 text-xs text-muted"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: getLanguageColor(language.name, index) }}
          />
          {language.name}
          <span className="tnum text-faint">{language.value.toFixed(1)}%</span>
        </span>
      ))}
    </div>
  );
}

export default function ProfileVisibility({ analysis }: ProfileVisibilityProps) {
  const { t, locale } = useLocale();
  const metrics = useMemo(() => calculateProfileVisibility(analysis), [analysis]);
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1 }),
    [locale]
  );

  if (analysis.analysisScope !== "owner") return null;

  const percent = (value: number) => `%${numberFormat.format(value)}`;
  const privateLanguageSummary = metrics.privateOnlyLanguages.length > 0
    ? metrics.privateOnlyLanguages.slice(0, 4).join(" · ")
    : t("visibility.noPrivateOnly");

  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
      <div className="border-b border-hairline p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-fg">{t("visibility.title")}</h2>
              <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-text">
                {t("visibility.ownerOnly")}
              </span>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {t("visibility.description")}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="tnum text-3xl font-semibold tracking-tight text-fg">
              {percent(metrics.publicVisibilityRatio)}
            </p>
            <p className="mt-1 text-xs text-faint">{t("visibility.ratio")}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-panel">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${metrics.publicVisibilityRatio}%` }}
              title={`${t("visibility.publicCode")}: ${percent(metrics.publicVisibilityRatio)}`}
            />
            <div
              className="h-full bg-warning transition-[width] duration-500"
              style={{ width: `${metrics.privateCodeRatio}%` }}
              title={`${t("visibility.privateCode")}: ${percent(metrics.privateCodeRatio)}`}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              {t("visibility.publicCode")} · {formatBytes(metrics.publicBytes)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-warning" />
              {t("visibility.privateCode")} · {formatBytes(metrics.privateBytes)}
            </span>
          </div>
          <p className="mt-3 rounded-lg bg-panel px-3 py-2 font-mono text-xs text-muted">
            {formatBytes(metrics.publicBytes)} / {formatBytes(metrics.totalBytes)} ≈ {percent(metrics.publicVisibilityRatio)}
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-hairline md:grid-cols-2">
        <div className="bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-fg">{t("visibility.outsider")}</h3>
              <p className="mt-1 text-xs text-faint">{t("visibility.outsiderDesc")}</p>
            </div>
            <span className="rounded-full border border-hairline px-2 py-1 text-[10px] uppercase tracking-wide text-faint">
              {t("visibility.publicLabel")}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="tnum text-lg font-semibold text-fg">{metrics.publicRepoCount}</p>
              <p className="text-[11px] text-faint">{t("visibility.repos")}</p>
            </div>
            <div>
              <p className="tnum text-lg font-semibold text-fg">{formatBytes(metrics.publicBytes)}</p>
              <p className="text-[11px] text-faint">{t("visibility.code")}</p>
            </div>
            <div>
              <p className="tnum text-lg font-semibold text-fg">{metrics.publicLanguages.length}</p>
              <p className="text-[11px] text-faint">{t("visibility.languages")}</p>
            </div>
          </div>
          <div className="mt-4">
            <SegmentBar segments={metrics.publicLanguages} height={9} />
          </div>
          <div className="mt-3">
            <LanguageList languages={metrics.publicLanguages} emptyLabel={t("visibility.noCode")} />
          </div>
        </div>

        <div className="bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-fg">{t("visibility.full")}</h3>
              <p className="mt-1 text-xs text-faint">{t("visibility.fullDesc")}</p>
            </div>
            <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] uppercase tracking-wide text-accent-text">
              {t("visibility.privateLabel")}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="tnum text-lg font-semibold text-fg">{metrics.totalRepoCount}</p>
              <p className="text-[11px] text-faint">{t("visibility.repos")}</p>
            </div>
            <div>
              <p className="tnum text-lg font-semibold text-fg">{formatBytes(metrics.totalBytes)}</p>
              <p className="text-[11px] text-faint">{t("visibility.code")}</p>
            </div>
            <div>
              <p className="tnum text-lg font-semibold text-fg">{metrics.fullLanguages.length}</p>
              <p className="text-[11px] text-faint">{t("visibility.languages")}</p>
            </div>
          </div>
          <div className="mt-4">
            <SegmentBar segments={metrics.fullLanguages} height={9} />
          </div>
          <div className="mt-3">
            <LanguageList languages={metrics.fullLanguages} emptyLabel={t("visibility.noCode")} />
          </div>
        </div>
      </div>

      <div className="border-t border-hairline p-5 md:p-6">
        <div>
          <h3 className="text-sm font-semibold text-fg">{t("visibility.hiddenTitle")}</h3>
          <p className="mt-1 text-xs text-faint">{t("visibility.hiddenDesc")}</p>
        </div>

        {metrics.privateRepoCount === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-hairline-strong p-5 text-center text-sm text-muted">
            {t("visibility.noPrivate")}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-hairline bg-panel p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{t("visibility.privateRatio")}</p>
              <p className="tnum mt-2 text-2xl font-semibold text-fg">{percent(metrics.privateCodeRatio)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t("visibility.privateRatioDesc")}</p>
            </div>
            <div className="rounded-xl border border-hairline bg-panel p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{t("visibility.privateLanguageDelta")}</p>
              <p className="tnum mt-2 text-2xl font-semibold text-fg">{metrics.privateOnlyLanguages.length}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{privateLanguageSummary}</p>
            </div>
            <div className="rounded-xl border border-hairline bg-panel p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{t("visibility.profileDifference")}</p>
              <p className="tnum mt-2 text-2xl font-semibold text-fg">{percent(metrics.skillProfileDifference)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t("visibility.profileDifferenceDesc")}</p>
            </div>

            <div className="rounded-xl border border-hairline bg-surface p-4 md:col-span-2">
              <h4 className="text-xs font-semibold text-fg">{t("visibility.languageShifts")}</h4>
              <div className="mt-3 space-y-2.5">
                {metrics.languageShifts.slice(0, 5).map((language, index) => (
                  <div key={language.name} className="flex items-center gap-3 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getLanguageColor(language.name, index) }}
                    />
                    <span className="min-w-0 flex-1 truncate text-muted">{language.name}</span>
                    <span className="tnum text-faint">
                      {numberFormat.format(language.publicShare)}% → {numberFormat.format(language.fullShare)}%
                    </span>
                    <span className={`tnum w-14 text-right font-medium ${language.delta >= 0 ? "text-success" : "text-warning"}`}>
                      {language.delta > 0 ? "+" : ""}{numberFormat.format(language.delta)} pp
                    </span>
                  </div>
                ))}
                {metrics.languageShifts.length === 0 && (
                  <p className="text-xs text-faint">{t("visibility.noLanguageShift")}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-hairline bg-surface p-4">
              <h4 className="text-xs font-semibold text-fg">{t("visibility.flagships")}</h4>
              <p className="mt-1 text-[11px] text-faint">{t("visibility.flagshipDesc")}</p>
              <div className="mt-3 space-y-2.5">
                {metrics.privateFlagships.map((repo) => (
                  <a
                    key={repo.name}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-hairline bg-panel px-3 py-2 transition-colors hover:border-hairline-strong"
                  >
                    <div className="truncate text-xs font-medium text-fg">{repo.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-faint">
                      <span>{formatBytes(repo.totalBytes)}</span>
                      <span className="tnum">{t("timeline.projectScore")} {Math.round(repo.advancedMetrics?.projectScore ?? 0)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-hairline bg-panel px-5 py-3 text-xs leading-relaxed text-faint md:px-6">
        {t("visibility.privacyNote")}
      </div>
    </section>
  );
}
