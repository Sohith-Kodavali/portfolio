"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** animate an inner <img> from slightly scaled to settle */
  zoom?: boolean;
  delay?: number;
};

/** Media reveal: clip-path wipes the block in as it enters the viewport. */
export default function ClipReveal({ children, className, zoom = true, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerGsap();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const image = zoom ? el.querySelector("img") : null;

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      delay
    });

    tl.fromTo(
      el,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "expo" }
    );

    if (image) {
      tl.fromTo(image, { scale: 1.22 }, { scale: 1, duration: 1.6, ease: "expo" }, 0);
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [zoom, delay]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
