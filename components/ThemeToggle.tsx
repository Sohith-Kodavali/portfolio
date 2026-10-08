"use client";

import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition-colors duration-300 hover:text-bone"
      data-cursor={mode === "dark" ? "Light" : "Dark"}
      aria-label="Toggle theme"
    >
      THEME[{mode === "dark" ? "D" : "L"}]
    </button>
  );
}
