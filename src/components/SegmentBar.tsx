"use client";

import { getLanguageColor } from "@/lib/utils";

interface Segment {
  name: string;
  value: number; // percentage
}

interface SegmentBarProps {
  segments: Segment[];
  height?: number;
  gap?: number;
  max?: number;
  rounded?: boolean;
}

/**
 * Signature chunky segmented bar of the bento design language.
 * Rounded, gapped segments colored by language. Collapses the long tail
 * into a single "other" segment.
 */
export default function SegmentBar({
  segments,
  height = 10,
  gap = 3,
  max = 8,
  rounded = true,
}: SegmentBarProps) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, max);
  const restValue = sorted.slice(max).reduce((s, x) => s + x.value, 0);
  const items =
    restValue > 0.01 ? [...top, { name: "__other", value: restValue }] : top;

  if (items.length === 0) {
    return (
      <div
        className="w-full bg-panel"
        style={{ height, borderRadius: rounded ? height / 2 : 4 }}
      />
    );
  }

  return (
    <div className="flex w-full" style={{ height, gap }}>
      {items.map((s, i) => (
        <div
          key={s.name}
          title={s.name === "__other" ? `+${s.value.toFixed(1)}%` : `${s.name} ${s.value.toFixed(1)}%`}
          style={{
            flex: `${Math.max(s.value, 0.5)} 0 0`,
            background: s.name === "__other" ? "var(--faint)" : getLanguageColor(s.name, i),
            borderRadius: rounded ? height / 2 : 3,
          }}
        />
      ))}
    </div>
  );
}
