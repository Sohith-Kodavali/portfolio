"use client";

import { useEffect, useRef } from "react";
import { onTick } from "@/lib/ticker";

// Recovered from the reference site's own spec:
//   "solid-scroll pointer trail: 16px display cells, 14-cell history, #c0fe04,
//    exact screen-cell anchoring"
const CELL = 16;
const HISTORY = 14;
const LIME = "192, 254, 4";
// How long a cell stays visible, in ms. Without this the trail only ever dropped
// cells when a new one pushed the oldest out — so stopping the pointer left the
// trail frozen on screen indefinitely.
const LIFETIME = 420;

/**
 * The pointer trail.
 *
 * The cursor drags a short history of squares behind it: 16px cells, 14 of them,
 * shrinking and fading with age. This is the effect that reads as boxes lighting
 * up and leaving traces as the pointer moves.
 *
 * Canvas 2D rather than WebGL. It is a dozen filled rectangles a frame, so a
 * second GL context would cost far more than it buys — and "exact screen-cell
 * anchoring" is trivial in 2D.
 *
 * Two details from the spec that matter more than they look:
 *
 *   - **Cells, not frames.** The trail records a new entry only when the pointer
 *     crosses into a different 16px cell. Tracking movement in cells rather than
 *     in time means the trail is the same length whether the pointer is dragged
 *     slowly or whipped across the screen.
 *   - **Screen anchoring.** Cells are computed from client coordinates, so the
 *     grid is fixed to the viewport and does not scroll with the page. The trail
 *     belongs to the cursor, not to the document.
 */
export default function PointerTrail() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(window.innerWidth * dpr);
      cv.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const trail: { x: number; y: number; t: number }[] = [];
    let px = -1;
    let py = -1;
    let inside = false;
    let dirty = false;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      inside = true;
    };
    const onLeave = () => {
      inside = false;
      dirty = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("pointerleave", onLeave);

    const clear = () => ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const stop = onTick(() => {
      const now = performance.now();

      if (inside && px >= 0) {
        const cx = Math.floor(px / CELL);
        const cy = Math.floor(py / CELL);
        const last = trail[trail.length - 1];
        if (!last || last.x !== cx || last.y !== cy) {
          trail.push({ x: cx, y: cy, t: now });
        }
      }

      // Age out by time first. This is what makes the trail dissolve when the
      // pointer stops, rather than waiting for the next movement to push it out.
      while (trail.length && now - trail[0].t > LIFETIME) trail.shift();
      while (trail.length > HISTORY) trail.shift();

      if (!trail.length) {
        if (dirty) {
          clear();
          dirty = false;
        }
        return;
      }
      dirty = true;

      clear();
      const newest = trail.length;
      for (let i = 0; i < trail.length; i++) {
        const cell = trail[i];
        // Fades over its own lifetime, brightest when newly laid down.
        const life = 1 - (now - cell.t) / LIFETIME;
        const recency = (i + 1) / newest;
        const a = Math.max(0, life) * recency;
        const size = CELL * (0.3 + a * 0.7);
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = `rgb(${LIME})`;
        ctx.fillRect(
          cell.x * CELL + CELL / 2 - size / 2,
          cell.y * CELL + CELL / 2 - size / 2,
          size,
          size
        );
      }
      ctx.globalAlpha = 1;
    });

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      // Sits under the custom cursor (z-400/401) so the cursor stays on top of
      // its own trail, and over the grid.
      className="pointer-events-none fixed inset-0 z-[398]"
    />
  );
}
