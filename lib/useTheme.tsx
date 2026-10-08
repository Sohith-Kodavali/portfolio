"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";

const ThemeCtx = createContext<{ mode: Mode; toggle: () => void }>({
  mode: "light",
  toggle: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    let stored: Mode | null = null;
    try {
      stored = localStorage.getItem("theme") as Mode | null;
    } catch {
      stored = null;
    }
    const initial: Mode = stored === "dark" ? "dark" : "light";
    setMode(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setMode((m) => {
      const next: Mode = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ mode, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
