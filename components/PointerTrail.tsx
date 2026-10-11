"use client";

import { useEffect, useRef } from "react";
import { onTick } from "@/lib/ticker";

// Recovered from the reference site's own spec:
//   "solid-scroll pointer trail: 16px display cells, 14-cell history, #c0fe04,
//    exact screen-cell anchoring"
const CELL = 16;
const HISTORY = 14;
const LIME = "192, 254, 4";
// How long a cell stays visible, in ms.
const LIFETIME = 520;

/**
 * The pointer trail: 16px cells the cursor drags behind it, shrinking and fading
 * with age. Canvas 2D rather than WebGL — a dozen filled rectangles a frame does
 * not justify a GL context, and "exact screen-cell anchoring" is trivial in 2D.
 *
 * Two details from the spec matter more than they look:
 *
 *   - **Cells, not frames.** The trail records cells, not samples, so it is the
 *     same length whether the pointer is dragged slowly or whipped across the
 *     screen. But moving *between* records is what made it look broken: recording
 *     only when the cell index changed left gaps on a fast flick, because the
 *     pointer crossed several cells between frames. The path is now walked
 *     cell-by-cell, so a fast move lays a continuous trail.
 *   - **Screen anchoring.** Cells come from client coordinates, so the grid is
 *     fixed to the viewport and does not scroll with the page.
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

    const cells: { x: number; y: number; t: number }[] = [];
    let px = 0;
    let py = 0;
    let has = false;
    let inside = false;
    let dirty = false;
    let lastCellX = Number.MIN_SAFE_INTEGER;
    let lastCellY = Number.MIN_SAFE_INTEGER;

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!has) {
        has = true;
        // Reset the last cell so re-entry starts a fresh trail instead of drawing
        // a line across the screen from wherever the pointer left.
        lastCellX = Number.MIN_SAFE_INTEGER;
        lastCellY = Number.MIN_SAFE_INTEGER;
      }
      inside = true;
    };
    const onOut = (event: PointerEvent) => {
      // relatedTarget is null only when the pointer actually leaves the window.
      if (event.relatedTarget) return;
      inside = false;
      has = false;
      dirty = true;
    };
    const onBlur = () => {
      inside = false;
      has = false;
      dirty = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", resize);

    const clear = () => ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const stop = onTick(() => {
      const now = performance.now();

      if (inside && has) {
        const cx = Math.floor(px / CELL);
        const cy = Math.floor(py / CELL);
        if (lastCellX === Number.MIN_SAFE_INTEGER) {
          cells.push({ x: cx, y: cy, t: now });
        } else if (cx !== lastCellX || cy !== lastCellY) {
          // Walk the path between the last cell and this one so a fast move
          // leaves a continuous trail rather than a dotted line.
          const dx = cx - lastCellX;
          const dy = cy - lastCellY;
          const steps = Math.max(Math.abs(dx), Math.abs(dy));
          for (let i = 1; i <= steps; i++) {
            const ix = Math.round(lastCellX + (dx * i) / steps);
            const iy = Math.round(lastCellY + (dy * i) / steps);
            const prev = cells[cells.length - 1];
            if (!prev || prev.x !== ix || prev.y !== iy) {
              cells.push({ x: ix, y: iy, t: now });
            }
          }
        }
        lastCellX = cx;
        lastCellY = cy;
      }

      // Age out by time first — this is what makes the trail dissolve when the
      // pointer stops rather than waiting for new movement to push it out.
      while (cells.length && now - cells[0].t > LIFETIME) cells.shift();
      while (cells.length > HISTORY) cells.shift();

      if (!cells.length) {
        if (dirty) {
          clear();
          dirty = false;
        }
        return;
      }
      dirty = true;

      clear();
      const newest = cells.length;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const life = 1 - (now - cell.t) / LIFETIME;
        const recency = (i + 1) / newest;
        const a = Math.max(0, life) * recency;
        const size = CELL * (0.3 + a * 0.7);
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = `rgb(${LIME})`;
        ctx.fillRect(cell.x * CELL + CELL / 2 - size / 2, cell.y * CELL + CELL / 2 - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    });

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      // Under the custom cursor (z-400/401) so the cursor stays on top of its
      // own trail, and over the grid.
      className="pointer-events-none fixed inset-0 z-[398]"
    />
  );
}
