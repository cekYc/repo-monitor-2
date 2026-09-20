"use client";

import { useEffect, useState } from "react";
import { listWatches, WATCHLIST_CHANGED_EVENT } from "@/lib/watchlist";

/** Watch count for the nav badge. Re-reads whenever a watch is toggled
 *  anywhere in the app. */
export default function useWatchCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      listWatches()
        .then((w) => active && setCount(w.length))
        .catch(() => {});
    };
    load();
    window.addEventListener(WATCHLIST_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, load);
    };
  }, []);

  return count;
}
