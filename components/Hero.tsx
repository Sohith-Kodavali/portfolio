"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { splitWords } from "@/lib/splitChars";
import { profile, stats } from "@/lib/data";
import { useClock } from "@/lib/useClock";
import { setHeroExit } from "@/lib/zoom";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const time = useClock();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    registerGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const title = el.querySelector<HTMLElement>("[data-hero-title]");
      const words = title ? splitWords(title) : [];
      const fades = el.querySelectorAll<HTMLElement>("[data-fade]");
      const blocks = el.querySelectorAll<HTMLElement>("[data-hero-block]");

      gsap.set(words, { yPercent: 118 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });

      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        const tl = gsap.timeline({ defaults: { ease: "expo" } });
        tl.to(words, { yPercent: 0, duration: 1.2, stagger: 0.05 }, 0)
          .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.25);
      };

      // Reveal on the loader's signal — but never leave content hidden if the
      // signal is missed (slow paint, restored tab, disabled JS timers).
      if (document.documentElement.dataset.ready === "1") start();
      window.addEventListener("app:ready", start, { once: true });
      const failsafe = window.setTimeout(start, 4200);
      window.setTimeout(() => window.clearTimeout(failsafe), 8000);

      gsap.to(blocks, {
        yPercent: -12,
        autoAlpha: 0.06,
        ease: "none",
        stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true }
      });

      // Drives the 3D pointer's exit: it scales down and slides off to the
      // right as the hero leaves, and stays hidden over the rest of the page.
      const exit = { p: 0 };
      gsap.to(exit, {
        p: 1,
        ease: "none",
        onUpdate: () => setHeroExit(exit.p),
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true }
      });

      ScrollTrigger.refresh();
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      id="top"
      className="relative flex min-h-screen flex-col shell pt-[92px] pb-[var(--gutter)]"
    >
      {/* top meta row */}
      <div className="grid grid-cols-12 gap-x-4 gap-y-6" data-hero-block>
        <h2
          data-fade
          className="col-span-12 t-display text-[clamp(20px,1.7vw,32px)] leading-[0.95] lg:col-span-3"
        >
          Design &<br />
          Engineering
        </h2>
        <p
          data-fade
          className="col-span-12 text-sm leading-relaxed text-muted lg:col-span-3 lg:col-start-5"
        >
          Thinking in systems.
          <br />
          Designing with care.
        </p>
        <p
          data-fade
          className="col-span-12 max-w-[46ch] text-sm leading-relaxed lg:col-span-4 lg:col-start-9"
        >
          {`I'm ${profile.name} — a design engineer building interfaces, systems and the
          motion that makes them legible. Currently taking on select work.`}
        </p>
      </div>

      {/* spacer — pushes the statement to the bottom, leaving the upper band for the 3D subject */}
      <div className="min-h-[18vh] flex-1" aria-hidden />

      {/* statement */}
      <div className="pb-[4vh]" data-hero-block>
        <h1 data-hero-title className="t-display t-huge">
          I build
          <br />
          interfaces
          <br />
          that feel <span className="text-accent">alive</span>
        </h1>
      </div>

      {/* status bar */}
      <div className="grid grid-cols-12 items-center gap-x-4 gap-y-3 border-t border-line pt-4" data-hero-block>
        <span
          data-fade
          className="col-span-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted lg:col-span-4"
        >
          {profile.location} · {time}
        </span>
        <span
          data-fade
          className="col-span-6 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-faint lg:col-span-4 lg:block"
        >
          {stats[0].value} projects · {stats[2].value} countries
        </span>
        <span
          data-fade
          className="col-span-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted lg:col-span-4 lg:justify-end"
        >
          Scroll to explore
          <span className="inline-block h-8 w-px overflow-hidden bg-line">
            <span className="block h-3 w-px animate-[scrolldot_1.8s_ease-in-out_infinite] bg-accent" />
          </span>
        </span>
      </div>

    </section>
  );
}
