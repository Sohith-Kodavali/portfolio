"use client";

import { useEffect, useRef } from "react";
import { onTick } from "@/lib/ticker";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/\\|=+$";
/** Shared cadence for every scramble instance, per the reference's 40ms ticker. */
const TICK_MS = 40;
const DURATION_MS = 900;

type Props = {
  text: string;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
};

/**
 * Characters cycle through a symbol set and settle into the real words — like a
 * terminal decoding a message.
 *
 * Runs on the shared ticker at a fixed 40ms cadence rather than its own loop, and
 * only after the line enters the viewport; it unsubscribes the moment the last
 * character settles, so a page full of headings costs nothing once they have
 * played.
 */
export default function ScrambleText({ text, className, as = "span" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      return;
    }

    const chars = Array.from(text);
    let elapsed = 0;
    let stop: (() => void) | null = null;

    const step = () => {
      elapsed += TICK_MS;
      const progress = elapsed / DURATION_MS;
      el.textContent = chars
        .map((char, index) => {
          if (char === " ") return " ";
          // Each character settles a little after the one before it, so the word
          // resolves left-to-right rather than snapping all at once.
          const settleAt = (index / Math.max(1, chars.length)) * 0.55 + 0.4;
          return progress >= settleAt ? char : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        })
        .join("");
      if (progress >= 1) {
        el.textContent = text;
        stop?.();
        stop = null;
      }
    };

    let last = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || stop) return;
        observer.disconnect();
        stop = onTick((time) => {
          if (time - last < TICK_MS / 1000) return;
          last = time;
          step();
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      stop?.();
    };
  }, [text]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = as as any;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
