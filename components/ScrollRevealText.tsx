"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { splitWordsPlain } from "@/lib/splitChars";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "h2" | "h3" | "div";
  start?: string;
  end?: string;
  /** opacity of words before they are scrolled through */
  dim?: number;
};

/**
 * The "text fills in as you scroll" reveal — words brighten progressively
 * as the block moves through the viewport. Scrub-driven, so it is tied to
 * scroll position rather than played once.
 */
export default function ScrollRevealText({
  children,
  className,
  as = "p",
  start = "top 80%",
  end = "bottom 55%",
  dim = 0.16
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = splitWordsPlain(el);
    if (!words.length) return;

    const tween = gsap.fromTo(
      words,
      { opacity: dim },
      {
        opacity: 1,
        ease: "none",
        duration: 1,
        stagger: 0.4,
        scrollTrigger: { trigger: el, start, end, scrub: true }
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [start, end, dim]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
