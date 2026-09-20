"use client";

/** Segmented control for in-page tabs (secondary analysis sections).
 *  Never used for top-level navigation — that belongs to real routes. */
export default function Segmented<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-panel border border-hairline overflow-x-auto max-w-full ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`h-7 px-2.5 rounded-md t-caption font-medium whitespace-nowrap transition-colors cursor-pointer ${
              active
                ? "bg-surface text-fg"
                : "text-muted hover:text-fg"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
