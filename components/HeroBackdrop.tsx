"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/lib/zoom";

/**
 * Hero backdrop: a soft blue wash with diagonal light streaks, like light
 * through a window. The streaks parallax against the cursor (transform only —
 * no gradient repaints) and the whole layer dissolves as the hero scrolls away,
 * blending into the flat page colour.
 */
export default function HeroBackdrop() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0.5;
    let ty = 0.42;
    let cx = 0.5;
    let cy = 0.42;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX / Math.max(window.innerWidth, 1);
      ty = e.clientY / Math.max(window.innerHeight, 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const loop = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;

      const el = root.current;
      if (el) {
        const ox = (cx - 0.5) * 46;
        const oy = (cy - 0.5) * 34;
        el.style.setProperty("--ox", `${ox.toFixed(2)}px`);
        el.style.setProperty("--oy", `${oy.toFixed(2)}px`);

        // Driven by the same value as the hero's scroll exit, so they stay in
        // lockstep and the fade reads as one motion.
        el.style.opacity = String(Math.max(0, 1 - stage.heroExit * 1.12));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={root} className="hero-backdrop" aria-hidden>
      <div className="hero-backdrop__wash" />
      <div className="hero-backdrop__streaks" />
    </div>
  );
}
