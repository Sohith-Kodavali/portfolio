"use client";

import { useEffect, useState } from "react";

export type Tier = "high" | "medium" | "low";

export type Quality = {
  tier: Tier;
  dpr: [number, number];
  particles: number;
  webgpu: boolean;
  reduced: boolean;
  ready: boolean;
  /** true only on capable machines — gates the expensive transmission pass */
  fx: boolean;
};

const fallback: Quality = {
  tier: "high",
  dpr: [1, 1.5],
  particles: 120000,
  webgpu: false,
  reduced: false,
  ready: false,
  fx: true
};

const PARTICLE_TARGETS: Record<Tier, number> = {
  high: 140000,
  medium: 65000,
  low: 26000
};

export function detectQuality(): Quality {
  if (typeof window === "undefined") return fallback;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const webgpu = "gpu" in navigator;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  // Capped at 1.5: the extra sharpness above that is barely visible but costs
  // ~2.3x the pixels to shade.
  const dprCap = reduced ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  let tier: Tier = "low";
  if (!reduced) {
    if (memory >= 8 && cores >= 8) tier = "high";
    else if (memory >= 4 && cores >= 4) tier = "medium";
  }

  return {
    tier,
    dpr: [1, dprCap],
    particles: PARTICLE_TARGETS[tier],
    webgpu,
    reduced,
    ready: true,
    fx: tier === "high" && !reduced
  };
}

export function useQuality(): Quality {
  const [quality, setQuality] = useState<Quality>(fallback);

  useEffect(() => {
    let frame = 0;
    const id = window.setTimeout(() => {
      frame = requestAnimationFrame(() => setQuality(detectQuality()));
    }, 0);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(frame);
    };
  }, []);

  return quality;
}
