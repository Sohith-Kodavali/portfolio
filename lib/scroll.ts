"use client";

type LenisLike = {
  /** Lenis' own smoothed scroll offset, updated when its raf runs. */
  scroll: number;
  scrollTo: (target: unknown, opts?: Record<string, unknown>) => void;
  stop: () => void;
  start: () => void;
};

export function scrollToId(hash: string) {
  if (typeof window === "undefined") return;
  const el = document.querySelector(hash);
  if (!el) return;
  const lenis = (window as Window & { __lenis?: LenisLike }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.5, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function getLenis(): LenisLike | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { __lenis?: LenisLike }).__lenis;
}

/**
 * The authoritative scroll offset for *this* frame.
 *
 * Read this instead of `window.scrollY` anywhere the value is compared against a
 * rendered frame — i.e. everywhere in the WebGL shell.
 *
 * The reason is browser compositing. Scroll input reaches the compositor thread
 * first, which shifts pre-rasterised tiles immediately; the main thread only
 * learns the new offset at least one frame later. So `window.scrollY` inside a
 * rAF callback is always reading the *previous* commit — the scroll position from
 * before the frame being drawn.
 *
 * Lenis sidesteps that: it drives `scrollTop` itself from the main thread each
 * frame, so by the time any other ticker subscriber runs, `lenis.scroll` is the
 * value that was just committed. DOM and canvas then agree on both the number and
 * the moment it became true — which is what stops the canvas drifting a frame
 * behind the page on fast scrolls.
 *
 * (Technique per JOYCO's WebGL Scroll Sync log; Lenis' raf is registered on the
 * GSAP ticker ahead of other subscribers in SmoothScroll, so this is already
 * updated by the time it is read.)
 */
export function getScrollY(): number {
  if (typeof window === "undefined") return 0;
  return getLenis()?.scroll ?? window.scrollY;
}
