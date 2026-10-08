"use client";

type LenisLike = {
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
