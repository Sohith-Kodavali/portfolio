"use client";

import { useEffect, useRef } from "react";

/**
 * Film-style colour grade. A single blended layer sits over the whole page and
 * its colour follows whichever tagged section owns the middle of the viewport,
 * so the site feels graded rather than decorated.
 *
 * Sections opt in with `data-grade="#rrggbb"` (or "none" to clear the tint).
 */
export default function ColorGrade() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-grade]"));
    if (!targets.length) return;

    let current = "";
    let raf = 0;
    let queued = false;

    const update = () => {
      queued = false;
      const mid = window.innerHeight * 0.5;

      // The active section is the last one that starts above the viewport
      // midpoint. Computed from live rects, so pinned sections (whose rects
      // span their whole pin range) can't confuse it the way an
      // intersection-ratio test does.
      let best: HTMLElement | null = null;
      let bestTop = -Infinity;
      for (const t of targets) {
        const top = t.getBoundingClientRect().top;
        if (top <= mid && top > bestTop) {
          bestTop = top;
          best = t;
        }
      }

      const colour = best?.dataset.grade ?? "none";
      if (colour === current) return;
      current = colour;

      if (colour === "none") {
        el.style.opacity = "0";
      } else {
        el.style.backgroundColor = colour;
        el.style.opacity = "1";
      }
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <div ref={ref} className="color-grade" aria-hidden />;
}
