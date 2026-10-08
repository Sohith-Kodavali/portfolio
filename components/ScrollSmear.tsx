"use client";

import { useEffect } from "react";

/**
 * Publishes scroll velocity to CSS as `--smear` / `--smear-skew`, so decorative
 * layers can lag and lean with the direction of travel. Deliberately applied to
 * those layers rather than the whole page — transforming an ancestor of a
 * pinned element breaks ScrollTrigger's pinning.
 */
export default function ScrollSmear() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let last = window.scrollY;
    let eased = 0;
    let raf = 0;

    const loop = () => {
      const y = window.scrollY;
      const v = y - last;
      last = y;
      eased += (v - eased) * 0.11;

      const n = Math.max(-1, Math.min(1, eased / 55));
      root.style.setProperty("--smear", `${(n * 26).toFixed(2)}px`);
      root.style.setProperty("--smear-skew", `${(n * 0.85).toFixed(3)}deg`);
      root.style.setProperty("--smear-amt", n.toFixed(4));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
