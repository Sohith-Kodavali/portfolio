"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { testimonials } from "@/lib/data";
import SplitHeading from "./SplitHeading";

export default function Testimonials() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const section = root.current;
    const inner = track.current;
    if (!section || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, inner.scrollWidth - window.innerWidth);

      gsap.to(inner, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance() * 0.85}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} aria-label="Testimonials" className="relative overflow-hidden">
      <div className="shell pt-[12vh]">
        <span className="t-eyebrow">Said about the work / 05</span>
        <SplitHeading className="t-lg mt-5 max-w-[18ch]">
          The proof is in the people who paid for it.
        </SplitHeading>
      </div>

      <div className="flex h-[62vh] items-center">
        <div ref={track} className="flex items-stretch gap-[3vw] shell will-change-transform">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex w-[72vw] shrink-0 flex-col justify-between border-l border-line pl-[3vw] lg:w-[36vw]"
            >
              <span className="font-mono text-xs text-line">0{i + 1}</span>
              <blockquote className="t-display t-md mt-8 leading-[1.06]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-10 flex items-center gap-3">
                <span className="size-9 rounded-full border border-line" />
                <span className="flex flex-col">
                  <span className="text-sm text-bone">{t.cite}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                    {t.org}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
          <div className="w-[16vw] shrink-0" aria-hidden />
        </div>
      </div>
    </section>
  );
}
