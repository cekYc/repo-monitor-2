"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { formatDate } from "@/lib/utils";
import type { RepoInfo } from "@/lib/github";

interface RepoTimelineProps {
  repos: RepoInfo[];
}

interface Row {
  name: string;
  created: number;
  updated: number;
  sameDay: boolean;
}

const ROW_H = 28;
const LABEL_W = 128;
const TICK_COUNT = 5;

function tickAlignClass(index: number, count: number): string {
  if (index === 0) return "translate-x-0";
  if (index === count - 1) return "-translate-x-full";
  return "-translate-x-1/2";
}

export default function RepoTimeline({ repos }: RepoTimelineProps) {
  const { t } = useLocale();
  const [hovered, setHovered] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!containerRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      
      const scrollDiv = containerRef.current.querySelector('[data-scroll-container]') as HTMLElement;
      const originalMaxHeight = scrollDiv.style.maxHeight;
      const originalOverflow = scrollDiv.style.overflowY;
      
      scrollDiv.style.maxHeight = 'none';
      scrollDiv.style.overflowY = 'visible';

      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#09090b" : "#ffffff",
        pixelRatio: 2,
      });

      scrollDiv.style.maxHeight = originalMaxHeight;
      scrollDiv.style.overflowY = originalOverflow;

      const link = document.createElement("a");
      link.download = `timeline-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Timeline export failed:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const rows: Row[] = useMemo(() => {
    return repos
      .filter((r) => r.created_at && r.updated_at)
      .map((r) => ({
        name: r.name,
        created: new Date(r.created_at).getTime(),
        updated: new Date(r.updated_at).getTime(),
        sameDay: r.created_at.slice(0, 10) === r.updated_at.slice(0, 10),
      }))
      .sort((a, b) => a.created - b.created);
  }, [repos]);

  const { min, max } = useMemo(() => {
    if (rows.length === 0) return { min: 0, max: 1 };
    let mn = Infinity;
    let mx = -Infinity;
    for (const r of rows) {
      if (r.created < mn) mn = r.created;
      if (r.updated > mx) mx = r.updated;
    }
    if (mn === mx) mx = mn + 1000 * 60 * 60 * 24;
    return { min: mn, max: mx };
  }, [rows]);

  const pct = (ts: number) => ((ts - min) / (max - min)) * 100;

  const ticks = useMemo(
    () => Array.from({ length: TICK_COUNT }, (_, i) => min + ((max - min) * i) / (TICK_COUNT - 1)),
    [min, max]
  );

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-fg">
          {t("timeline.title")}
          <span className="text-xs text-faint tnum ml-2">{rows.length}</span>
        </h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-xs px-3 py-1.5 rounded-lg bg-accent-soft text-accent-text hover:bg-accent-soft/70 transition-colors cursor-pointer disabled:opacity-50 font-medium"
        >
          {exporting ? t("timeline.exporting") : t("timeline.export")}
        </button>
      </div>

      {/* Axis */}
      <div className="flex items-center gap-3 mb-1">
        <span className="shrink-0" style={{ width: LABEL_W }} />
        <div className="relative flex-1 h-5 border-b border-hairline">
          {ticks.map((tk, i) => (
            <span
              key={i}
              className={`absolute -top-0.5 text-[11px] text-faint tnum whitespace-nowrap ${tickAlignClass(i, TICK_COUNT)}`}
              style={{ left: `${pct(tk)}%` }}
            >
              {formatDate(new Date(tk).toISOString())}
            </span>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="max-h-96 overflow-y-auto pr-1" data-scroll-container>
        {rows.map((r) => {
          const left = pct(r.created);
          const right = pct(r.updated);
          return (
            <div
              key={r.name}
              className={`flex items-center gap-3 rounded-lg px-1 -mx-1 transition-colors ${
                hovered === r.name ? "bg-panel" : ""
              }`}
              style={{ height: ROW_H }}
              onMouseEnter={() => setHovered(r.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="shrink-0 text-xs text-muted truncate" style={{ width: LABEL_W }} title={r.name}>
                {r.name}
              </span>
              <div className="relative flex-1 h-full">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-hairline" />
                {r.sameDay ? (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent"
                    style={{ left: `${left}%` }}
                    title={`${r.name} · ${formatDate(new Date(r.created).toISOString())}`}
                  />
                ) : (
                  <>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-accent-soft"
                      style={{ left: `${left}%`, width: `${Math.max(right - left, 0.5)}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-faint"
                      style={{ left: `${left}%` }}
                      title={`${r.name} · ${t("repo.createdAt")} · ${formatDate(new Date(r.created).toISOString())}`}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent"
                      style={{ left: `${right}%` }}
                      title={`${r.name} · ${t("repo.updatedAt")} · ${formatDate(new Date(r.updated).toISOString())}`}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-hairline text-xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-faint inline-block" />
          {t("repo.createdAt")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
          {t("repo.updatedAt")}
        </span>
        <span className="text-faint">{t("timeline.noChange")}</span>
      </div>
    </div>
  );
}
