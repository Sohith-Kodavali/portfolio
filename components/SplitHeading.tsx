"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { splitWords } from "@/lib/splitChars";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  delay?: number;
  stagger?: number;
  start?: string;
};

export default function SplitHeading({
  children,
  as = "h2",
  className,
  delay = 0,
  stagger = 0.06,
  start = "top 85%"
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = splitWords(el);
    gsap.set(words, { yPercent: 118 });

    const tween = gsap.to(words, {
      yPercent: 0,
      duration: 1.1,
      ease: "expo",
      stagger,
      delay,
      scrollTrigger: { trigger: el, start, once: true }
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      ScrollTrigger.refresh();
    };
  }, [delay, stagger, start]);

  // Polymorphic tag — the union of literal tags is too narrow for TS JSX.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={cn("t-display", className)}>
      {children}
    </Tag>
  );
}
