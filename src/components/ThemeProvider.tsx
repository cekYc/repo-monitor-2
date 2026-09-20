"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { notifyStoredChange, useStoredString } from "@/lib/use-stored";

export type Theme = "light" | "dark";

export const THEME_KEY = "repo-monitor-theme";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Dark-first. The cookie gives the server the right class for the first
 *  paint, the stored preference takes over on the client, and the class on
 *  <html> is kept in sync by a DOM-only effect. */
export function ThemeProvider({
  initialTheme = "dark",
  children,
}: {
  initialTheme?: Theme;
  children: React.ReactNode;
}) {
  const stored = useStoredString(THEME_KEY, initialTheme);
  const theme: Theme = stored === "light" ? "light" : "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // blocked storage: the cookie below still carries the choice
    }
    document.cookie = `${THEME_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.classList.toggle("dark", next === "dark");
    notifyStoredChange();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}
