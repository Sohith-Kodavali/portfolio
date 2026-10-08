"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/lib/zoom";

const COLORS = ["#38bdf8", "#60a5fa", "#8b5cf6", "#22d3ee", "#e2e8f0"];
const COUNT = 110;

/**
 * Hyper-speed star-warp tunnel — perspective streaks radiating from a central
 * vanishing point, driven by the transition progress.
 *
 * Streaks are bucketed by (width, alpha, colour) and stroked in batches, so a
 * frame costs ~a dozen draw calls instead of one per streak.
 */
export default function WarpTunnel() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    // A dark background behind heavy blur does not need retina resolution.
    const dpr = 1;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const maxR = () => Math.hypot(w, h) * 0.55;

    // Built client-side so server and client markup stay identical.
    const streaks = Array.from({ length: COUNT }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * maxR(),
      len: 30 + Math.random() * 150,
      speed: 0.35 + Math.random() * 1.15,
      colorIndex: Math.floor(Math.random() * COLORS.length),
      weight: 0.6 + Math.random() * 1.6
    }));

    // key = widthBucket * 15 + alphaBucket * 5 + colourIndex
    const buckets = new Map<number, number[]>();

    let raf = 0;

    const loop = () => {
      const p = stage.warp;
      ctx.clearRect(0, 0, w, h);

      if (p > 0.22) {
        const intensity = Math.min(1, (p - 0.22) / 0.18);
        const cx = w / 2;
        const cy = h / 2;
        const R = maxR();

        buckets.clear();
        for (const s of streaks) {
          s.r += (0.8 + p * 9) * s.speed * (1 + s.r / (R * 0.5));
          if (s.r > R) {
            s.r = 1 + Math.random() * 6;
            s.a = Math.random() * Math.PI * 2;
          }

          const fade = Math.min(1, s.r / (R * 0.12));
          const alpha = intensity * fade * 0.85;
          if (alpha < 0.03) continue;

          const wb = s.weight > 1.4 ? 1 : 0;
          const ab = alpha > 0.55 ? 2 : alpha > 0.25 ? 1 : 0;
          const key = wb * 15 + ab * 5 + s.colorIndex;

          let arr = buckets.get(key);
          if (!arr) {
            arr = [];
            buckets.set(key, arr);
          }
          const ca = Math.cos(s.a);
          const sa = Math.sin(s.a);
          const r2 = s.r + s.len * (0.25 + p * 1.2);
          arr.push(cx + ca * s.r, cy + sa * s.r, cx + ca * r2, cy + sa * r2);
        }

        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";

        for (const [key, coords] of buckets) {
          const wb = Math.floor(key / 15);
          const ab = Math.floor((key % 15) / 5);
          const ci = key % 5;

          ctx.globalAlpha = ab === 2 ? 0.85 : ab === 1 ? 0.42 : 0.16;
          ctx.strokeStyle = COLORS[ci];
          ctx.lineWidth = wb ? 2.4 : 1.1;

          ctx.beginPath();
          for (let i = 0; i < coords.length; i += 4) {
            ctx.moveTo(coords[i], coords[i + 1]);
            ctx.lineTo(coords[i + 2], coords[i + 3]);
          }
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
