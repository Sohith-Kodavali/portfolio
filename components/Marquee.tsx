"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { tickerWords } from "@/lib/data";

export default function Marquee() {
  const track = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.to(el, {
      xPercent: -50,
      duration: 30,
      ease: "none",
      repeat: -1
    });

    let last = window.scrollY;
    const onScroll = () => {
      const v = Math.min(Math.abs(window.scrollY - last) * 0.05, 5);
      last = window.scrollY;
      gsap.timeline()
        .to(tween, { timeScale: 1 + v, duration: 0.25, overwrite: true }, 0)
        .to(inner.current, { skewY: Math.sign(window.scrollY - last) * -1.6, duration: 0.25, overwrite: true }, 0)
        .to(tween, { timeScale: 1, duration: 1.1, delay: 0.2 }, 0.25)
        .to(inner.current, { skewY: 0, duration: 0.9, ease: "power2.out" }, 0.25);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      tween.kill();
    };
  }, []);

  const row = (
    <div ref={inner} className="flex shrink-0 items-center">
      {tickerWords.map((w) => (
        <span key={w} className="flex items-center">
          <span className="px-7 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {w}
          </span>
          <span className="text-accent">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <section aria-label="Capabilities ticker" className="overflow-hidden border-y border-line py-6">
      <div ref={track} className="marquee">
        {row}
        {row}
      </div>
    </section>
  );
}
