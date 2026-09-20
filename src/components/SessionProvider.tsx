"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SessionUser {
  login: string;
  avatarUrl: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

/** One session fetch per page load, shared by the header and the Analyze
 *  screen (which needs to know whether the target is the visitor's own
 *  profile before it trusts the public localStorage cache). */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (active) setUser((data?.user as SessionUser) ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    setUser(null);
    // Owner analyses can contain private repo data. A full navigation clears
    // client state too, so nothing survives the sign-out on screen.
    window.location.assign("/");
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
