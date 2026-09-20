"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORED_CHANGED = "rm:stored-changed";

/** Writers call this after touching localStorage so same-tab readers update.
 *  Cross-tab updates arrive through the browser's own `storage` event. */
export function notifyStoredChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORED_CHANGED));
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORED_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORED_CHANGED, onChange);
  };
}

/** Reads a stored string through React's external-store bridge.
 *
 *  The server (and the hydration render) sees `fallback`, which is why the
 *  theme and locale come from a cookie: the first paint is correct, React
 *  swaps in the stored value on the client, and no effect has to set state. */
export function useStoredString(key: string, fallback: string): string {
  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
