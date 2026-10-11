"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, registerGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import ScrambleText from "./ScrambleText";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
};

/**
 * Section heading reveal: the line bleeds in from the bottom through a blur that
 * resolves, and its text decodes from symbols into the real words.
 *
 * This used to also morph the variable font's width and weight axes on scroll.
 * That morph is gone — the reference keeps its type axes fixed and gets its text
 * motion from the decode, and the two fought each other (the letterforms changed
 * shape under a line that was still resolving).
 */
export default function HeadingReveal({ children, className, as = "h2" }: Props) {
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

    return () => {
      wipe.kill();
    };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={cn("t-display", className)}>
      {typeof children === "string" ? <ScrambleText text={children} /> : children}
    </Tag>
  );
}
