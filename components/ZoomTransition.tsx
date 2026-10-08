"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { setWarp, stage } from "@/lib/zoom";
import { processSteps } from "@/lib/data";
import WarpTunnel from "./WarpTunnel";

// The transition now carries the process, one point at a time.
const STEPS = processSteps;

// [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] per step. The gaps between
// fade-in and fade-out are deliberately wide: that is the reading time.
const WINDOWS: [number, number, number, number][] = [
  [0.33, 0.37, 0.47, 0.51],
  [0.49, 0.53, 0.63, 0.67],
  [0.65, 0.69, 0.79, 0.83],
  [0.81, 0.85, 1.05, 1.08]
];

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * The pinned transition. Scrolling here:
 *   1. the 3D pointer re-enters from the right and scales up until it masks the screen
 *   2. the background goes dark (#050505) and the warp tunnel takes over
 *   3. the process steps play through one at a time inside the tunnel
 */
export default function ZoomTransition() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const steps = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;

    const proxy = { p: 0 };

    const apply = (p: number) => {
      setWarp(p);

      if (dark.current) {
        dark.current.style.opacity = String(clamp01((p - 0.2) / 0.14));
      }

      // The screen is never blank: a hint holds the frame until the pointer
      // starts moving, then gets out of the way.
      if (hint.current) hint.current.style.opacity = String(clamp01(1 - p / 0.1));

      // Fade the site chrome out while the tunnel is on screen.
      document.documentElement.toggleAttribute("data-warping", p > 0.18 && p < 0.995);

      steps.current.forEach((node, i) => {
        if (!node) return;
        const [ia, ib, oa, ob] = WINDOWS[i];
        const rise = clamp01((p - ia) / (ib - ia));
        const fall = clamp01((p - oa) / (ob - oa));
        node.style.opacity = String(Math.max(0, rise - fall));
        node.style.transform = `translateY(${(1 - rise) * 30}px)`;
      });
    };

    const ctx = gsap.context(() => {
      // Tells the WebGL pointer whether this section owns the screen. Fires as
      // soon as the section starts entering, so the object is already on screen
      // by the time the pin catches — no empty frame.
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          stage.transitionVisible = self.isActive;
        }
      });

      gsap.to(proxy, {
        p: 1,
        ease: "none",
        onUpdate: () => apply(proxy.p),
        scrollTrigger: {
          trigger: el,
          start: "top top",
          // Long enough that all four steps get a comfortable read.
          end: "+=380%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }, el);

    return () => {
      ctx.revert();
      setWarp(0);
      stage.transitionVisible = false;
      document.documentElement.removeAttribute("data-warping");
    };
  }, []);

  return (
    <section ref={root} className="relative h-screen overflow-hidden" aria-label="Transition">
      {/* dark backdrop the pointer mask hands over to */}
      <div
        ref={dark}
        className="absolute inset-0 z-0"
        style={{ background: "#050505", opacity: 0 }}
        aria-hidden
      />

      {/* hyper-speed tunnel */}
      <div className="absolute inset-0 z-10">
        <WarpTunnel />
      </div>

      {/* holds the frame before the pointer animation begins */}
      <span
        ref={hint}
        className="t-eyebrow pointer-events-none absolute inset-x-0 bottom-[7vh] z-20 text-center text-muted"
      >
        Keep scrolling
      </span>

      {/* process steps, one at a time, inside the tunnel */}
      <div className="absolute inset-0 z-20">
        {STEPS.map((step, i) => (
          <div
            key={step.idx}
            ref={(node) => {
              steps.current[i] = node;
            }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[6vw] text-center text-white will-change-[opacity,transform]"
            style={{ opacity: 0 }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
              {step.idx} — How it happens
            </span>
            <h2
              className="t-display mt-5 max-w-[15ch]"
              style={{ fontSize: "clamp(34px, 6.6vw, 118px)" }}
            >
              {step.title}
            </h2>
            <p className="mt-6 max-w-[46ch] text-sm leading-relaxed text-white/70 lg:text-base">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
