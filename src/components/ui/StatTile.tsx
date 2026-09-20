"use client";

import type { ReactNode } from "react";
import useFormat from "@/components/useFormat";

/** One number, one label. The delta is the only colored element. */
export default function StatTile({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta?: number;
  sub?: ReactNode;
}) {
  const fmt = useFormat();

  return (
    <div className="card p-4">
      <div className="t-micro text-faint truncate">{label}</div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="t-stat text-fg truncate">{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={`t-caption font-medium tnum ${delta > 0 ? "text-success" : "text-danger"}`}
          >
            {delta > 0 ? "+" : ""}
            {fmt.num(delta)}
          </span>
        )}
      </div>
      {sub && <div className="t-caption text-faint mt-1 truncate">{sub}</div>}
    </div>
  );
}
