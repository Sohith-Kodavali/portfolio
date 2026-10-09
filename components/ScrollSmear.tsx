"use client";

import { useEffect } from "react";
import { onTick } from "@/lib/ticker";

/**
 * Publishes scroll velocity to CSS as `--smear` / `--smear-skew`, so decorative
 * layers can lag and lean with the direction of travel. Deliberately applied to
 * those layers rather than the whole page — transforming an ancestor of a
 * pinned element breaks ScrollTrigger's pinning.
 *
 * Runs on the shared ticker rather than its own rAF loop.
 */
export default function ScrollSmear() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let last = window.scrollY;
    let eased = 0;
    // Skips the DOM writes entirely once the motion has settled, instead of
    // re-writing three custom properties on a still page 60 times a second.
    let settled = true;

    return onTick(() => {
      const y = window.scrollY;
      const v = y - last;
      last = y;

      if (v === 0 && eased === 0) {
        if (settled) return;
        settled = true;
        root.style.setProperty("--smear", "0px");
        root.style.setProperty("--smear-skew", "0deg");
        root.style.setProperty("--smear-amt", "0");
        return;
      }
      settled = false;

      eased += (v - eased) * 0.11;

      const n = Math.max(-1, Math.min(1, eased / 55));
      root.style.setProperty("--smear", `${(n * 26).toFixed(2)}px`);
      root.style.setProperty("--smear-skew", `${(n * 0.85).toFixed(3)}deg`);
      root.style.setProperty("--smear-amt", n.toFixed(4));
    });
  }, []);

  return null;
}
