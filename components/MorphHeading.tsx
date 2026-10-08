"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, registerGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** width axis at the start / end of the scroll range */
  wdth?: [number, number];
  /** weight axis at the start / end of the scroll range */
  wght?: [number, number];
};

/**
 * Section heading with two behaviours stacked:
 *   1. an ink-wipe reveal — the line bleeds in from the bottom with a blur
 *      that resolves, rather than sliding up;
 *   2. a continuous type morph — the variable font's width and weight axes
 *      track scroll position, so the letterforms physically fatten and
 *      compress as you move through the section.
 */
export default function MorphHeading({
  children,
  className,
  as = "h2",
  wdth = [96, 118],
  wght = [700, 880]
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wipe = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        el.animate(
          [
            { clipPath: "inset(0% 0% 100% 0%)", filter: "blur(8px)" },
            { clipPath: "inset(0% 0% 0% 0%)", filter: "blur(0px)" }
          ],
          { duration: 1100, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
        );
      }
    });

    const morph = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      end: "bottom 35%",
      scrub: true,
      onUpdate: (self) => {
        const w = wdth[0] + (wdth[1] - wdth[0]) * self.progress;
        const g = wght[0] + (wght[1] - wght[0]) * self.progress;
        el.style.fontVariationSettings = `"wdth" ${w.toFixed(1)}, "wght" ${g.toFixed(0)}`;
      }
    });

    return () => {
      wipe.kill();
      morph.kill();
    };
  }, [wdth, wght]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={cn("t-display", className)}
      style={{ fontVariationSettings: `"wdth" ${wdth[0]}, "wght" ${wght[0]}` }}
    >
      {children}
    </Tag>
  );
}
