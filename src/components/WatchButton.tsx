"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  addWatch,
  removeWatch,
  isWatched,
  makeWatchId,
  type WatchType,
} from "@/lib/watchlist";

interface WatchButtonProps {
  type: WatchType;
  label: string; // "login" or "owner/name"
  avatarUrl?: string;
  size?: "sm" | "md";
  onChange?: (watching: boolean) => void;
}

export default function WatchButton({
  type,
  label,
  avatarUrl,
  size = "md",
  onChange,
}: WatchButtonProps) {
  const { t } = useLocale();
  const [watching, setWatching] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const id = makeWatchId(type, label);

  useEffect(() => {
    let active = true;
    isWatched(id).then((w) => active && setWatching(w));
    return () => {
      active = false;
    };
  }, [id]);

  const toggle = useCallback(async () => {
    if (busy || watching === null) return;
    setBusy(true);
    try {
      if (watching) {
        await removeWatch(id);
        setWatching(false);
        onChange?.(false);
      } else {
        await addWatch({ id, type, label, avatarUrl });
        setWatching(true);
        onChange?.(true);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, watching, id, type, label, avatarUrl, onChange]);

  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={busy || watching === null}
      title={watching ? t("watch.remove") : t("watch.add")}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 ${pad} ${
        watching
          ? "bg-accent text-accent-fg hover:bg-accent-hover"
          : "bg-panel text-muted hover:text-fg"
      }`}
    >
      {watching ? (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
      {watching ? t("watch.added") : t("watch.add")}
    </button>
  );
}
