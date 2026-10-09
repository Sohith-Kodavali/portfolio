"use client";

import { useEffect } from "react";
import { THREE } from "@/lib/webgpu";

export type PointerState = {
  /** 0→1 screen UV, origin bottom-left, matching WebGL's convention. */
  uv: THREE.Vector2;
  /** False once the pointer leaves the window, the tab blurs or is hidden. */
  inside: boolean;
};

const CENTRE = 0.5;

const state: PointerState = {
  uv: new THREE.Vector2(CENTRE, CENTRE),
  inside: false
};

let subscribers = 0;
let detach: (() => void) | null = null;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * One pointer coordinate system for every effect.
 *
 * Each effect used to convert browser coordinates itself, which is fine until
 * there are several of them and they disagree about Y inversion and what
 * "left the window" means. This converts once, keeps a single `inside` flag,
 * and returns both the WebGL UV and that flag to centre whenever the pointer
 * leaves the window, the tab blurs or it is hidden — so effects settle to their
 * resting state rather than jumping from a stale coordinate when it returns.
 */
function attach() {
  if (detach || typeof window === "undefined") return;

  const onMove = (event: PointerEvent) => {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    state.uv.set(clamp01(event.clientX / width), clamp01(1 - event.clientY / height));
    state.inside = event.clientX >= 0 && event.clientX <= width && event.clientY >= 0 && event.clientY <= height;
  };
  const onLeave = (event: MouseEvent) => {
    if (event.relatedTarget) return;
    state.inside = false;
    state.uv.set(CENTRE, CENTRE);
  };
  const onBlur = () => {
    state.inside = false;
    state.uv.set(CENTRE, CENTRE);
  };
  const onHidden = () => {
    if (!document.hidden) return;
    state.inside = false;
    state.uv.set(CENTRE, CENTRE);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseout", onLeave, { passive: true });
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onHidden);

  detach = () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("mouseout", onLeave);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onHidden);
    detach = null;
  };
}

/** Installs the single shared set of listeners; ref-counted, safe to call often. */
export function usePointerBus() {
  useEffect(() => {
    subscribers += 1;
    attach();
    return () => {
      subscribers -= 1;
      if (subscribers <= 0) detach?.();
    };
  }, []);
}

/** Live pointer state for per-frame WebGL reads (no React re-render). */
export function getPointer(): PointerState {
  return state;
}
