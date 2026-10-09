"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  // Written straight to the DOM from the timeline. Driving this through React
  // state re-rendered this entire component ~60x a second for two seconds, for
  // a number whose only job is to animate.
  const counterEl = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    registerGsap();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      setDone(true);
      document.documentElement.dataset.ready = "1";
      getLenis()?.scrollTo(0, { immediate: true });
      window.dispatchEvent(new Event("app:ready"));
    };

    if (reduced) {
      finish();
      return;
    }

    getLenis()?.stop();
    document.documentElement.classList.add("lenis-stopped");
    document.body.style.overflow = "hidden";

    const words = root.current?.querySelectorAll<HTMLElement>(".reveal-mask > span") ?? [];
    const line = root.current?.querySelector<HTMLElement>("[data-line]") ?? null;
    const meta = root.current?.querySelectorAll<HTMLElement>("[data-meta]") ?? [];

    gsap.set(words, { yPercent: 115 });
    gsap.set(meta, { opacity: 0, y: 12 });
    gsap.set(line, { scaleX: 0, transformOrigin: "left center" });

    const counter = { v: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "expo" },
      onComplete: () => {
        document.documentElement.classList.remove("lenis-stopped");
        document.body.style.overflow = "";
        getLenis()?.start();
        finish();
      }
    });

    tl.to(words, { yPercent: 0, duration: 1.15, stagger: 0.09 }, 0.15)
      .to(meta, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.35)
      .to(line, { scaleX: 1, duration: 1.9, ease: "quint" }, 0.1)
      .to(
        counter,
        {
          v: 100,
          duration: 1.9,
          ease: "quint",
          onUpdate: () => {
            if (counterEl.current) {
              counterEl.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
            }
          }
        },
        0.1
      )
      .to(meta, { opacity: 0, duration: 0.4 }, 1.9)
      .to(words, { yPercent: -115, duration: 0.9, stagger: 0.05, ease: "expo.in" }, 1.95)
      .to(line, { scaleX: 0, transformOrigin: "right center", duration: 0.7, ease: "expo.in" }, 2.0)
      .to(root.current, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, 2.35);

    return () => {
      tl.kill();
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[500] flex flex-col justify-between bg-ink shell py-[var(--gutter)]"
      aria-label="Loading"
      role="status"
    >
      <div className="flex items-center justify-between">
        <span data-meta className="t-eyebrow">
          Portfolio — MMXXVI
        </span>
        <span data-meta className="t-eyebrow">
          Loading assets
        </span>
      </div>

      <div className="flex flex-col items-start gap-6">
        <h1 className="t-display t-lg max-w-[14ch]">
          <span className="reveal-mask">
            <span>Sohith</span>
          </span>
          <br />
          <span className="reveal-mask">
            <span>Kodavali</span>
          </span>
        </h1>
        <div data-meta className="flex items-baseline gap-3 font-mono text-sm text-muted">
          <span ref={counterEl} className="tabular-nums text-bone">
            000
          </span>
          <span>/</span>
          <span>100</span>
        </div>
      </div>

      <div className="relative h-px w-full bg-line">
        <div data-line className="absolute inset-0 bg-accent" />
      </div>
    </div>
  );
}
