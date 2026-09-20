"use client";

import { useId, useState, type ReactNode } from "react";

/** Secondary content lives behind this. Children mount only after the first
 *  open, so collapsed panels never spend API quota. */
export default function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [everOpen, setEverOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((v) => !v);
          setEverOpen(true);
        }}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-panel transition-colors"
      >
        <span className="min-w-0">
          <span className="block t-small font-medium text-fg truncate">{title}</span>
          {hint && <span className="block t-caption text-faint truncate">{hint}</span>}
        </span>
        <svg
          className={`w-4 h-4 text-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {everOpen && (
        <div id={panelId} hidden={!open} className="border-t border-hairline p-4">
          {children}
        </div>
      )}
    </div>
  );
}
