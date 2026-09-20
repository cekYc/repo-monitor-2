import type { ReactNode } from "react";

/** Standard content container: hairline border, 16px radius, no shadow. */
export function Card({
  children,
  className = "",
  pad = "md",
}: {
  children: ReactNode;
  className?: string;
  pad?: "none" | "sm" | "md" | "lg";
}) {
  const padding =
    pad === "none" ? "" : pad === "sm" ? "p-3" : pad === "lg" ? "p-5" : "p-4";
  return <div className={`card ${padding} ${className}`}>{children}</div>;
}

/** Section title row. `right` holds the section's controls, never a search box. */
export function SectionHeader({
  title,
  count,
  hint,
  right,
  className = "",
}: {
  title: string;
  count?: number | string;
  hint?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <div className="min-w-0">
        <h2 className="t-title text-fg flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="t-caption text-faint font-normal tnum">{count}</span>
          )}
        </h2>
        {hint && <p className="t-caption text-faint mt-0.5">{hint}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}
