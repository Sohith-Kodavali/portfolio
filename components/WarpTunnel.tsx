"use client";

import { useEffect, useRef } from "react";
import { stage } from "@/lib/zoom";

const COLORS = ["#38bdf8", "#60a5fa", "#8b5cf6", "#22d3ee", "#e2e8f0"];
const COUNT = 110;
const SMOKE = 11;

/** Pre-renders a soft puff once so the smoke layer is drawImage, not gradients. */
function makePuff(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(150,190,255,0.55)");
  g.addColorStop(0.45, "rgba(90,130,200,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * Hyper-speed star-warp tunnel with volume: far streaks, then drifting haze,
 * then near streaks drawn on top — so the field has real depth instead of
 * being one flat plane of lines.
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
    const dpr = 1;
    const puff = makePuff();

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

    // `near` streaks draw after the haze, `far` before it.
    const streaks = Array.from({ length: COUNT }, (_, i) => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * maxR(),
      len: 30 + Math.random() * 150,
      speed: 0.35 + Math.random() * 1.15,
      colorIndex: Math.floor(Math.random() * COLORS.length),
      weight: 0.6 + Math.random() * 1.6,
      near: i % 3 === 0
    }));

    const haze = Array.from({ length: SMOKE }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.35 + Math.random() * 0.5,
      alpha: 0.06 + Math.random() * 0.09,
      vx: (Math.random() - 0.5) * 0.006,
      vy: (Math.random() - 0.5) * 0.006,
      ph: Math.random() * Math.PI * 2
    }));

    const buckets = new Map<number, number[]>();

    const drawStreaks = (near: boolean, intensity: number, p: number) => {
      buckets.clear();
      const cx = w / 2;
      const cy = h / 2;
      const R = maxR();

      for (const s of streaks) {
        if (s.near !== near) continue;
        const fade = Math.min(1, s.r / (R * 0.12));
        const alpha = intensity * fade * (near ? 0.95 : 0.4);
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
        const r2 = s.r + s.len * (0.25 + p * 1.2) * (near ? 1.35 : 0.8);
        arr.push(cx + ca * s.r, cy + sa * s.r, cx + ca * r2, cy + sa * r2);
      }

      ctx.lineCap = "round";
      for (const [key, coords] of buckets) {
        const wb = Math.floor(key / 15);
        const ab = Math.floor((key % 15) / 5);
        const ci = key % 5;
        ctx.globalAlpha = ab === 2 ? 0.85 : ab === 1 ? 0.42 : 0.16;
        ctx.strokeStyle = COLORS[ci];
        ctx.lineWidth = (wb ? 2.4 : 1.1) * (near ? 1.7 : 0.8);
        ctx.beginPath();
        for (let i = 0; i < coords.length; i += 4) {
          ctx.moveTo(coords[i], coords[i + 1]);
          ctx.lineTo(coords[i + 2], coords[i + 3]);
        }
        ctx.stroke();
      }
    };

    let raf = 0;

    const loop = () => {
      const p = stage.warp;
      ctx.clearRect(0, 0, w, h);

      if (p > 0.22) {
        const intensity = Math.min(1, (p - 0.22) / 0.18);
        const R = maxR();

        for (const s of streaks) {
          s.r += (0.8 + p * 9) * s.speed * (1 + s.r / (R * 0.5)) * (s.near ? 1.25 : 0.9);
          if (s.r > R) {
            s.r = 1 + Math.random() * 6;
            s.a = Math.random() * Math.PI * 2;
          }
        }

        // far layer
        ctx.globalCompositeOperation = "lighter";
        drawStreaks(false, intensity, p);

        // haze between the layers
        ctx.globalCompositeOperation = "screen";
        for (const s of haze) {
          s.x += s.vx * (0.4 + p);
          s.y += s.vy * (0.4 + p);
          const px = ((s.x % 1) + 1) % 1;
          const py = ((s.y % 1) + 1) % 1;
          const size = s.size * Math.max(w, h) * (0.85 + Math.sin(s.ph + p * 3) * 0.15);
          ctx.globalAlpha = s.alpha * intensity;
          ctx.drawImage(puff, px * w - size / 2, py * h - size / 2, size, size);
        }

        // near layer
        ctx.globalCompositeOperation = "lighter";
        drawStreaks(true, intensity, p);

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
