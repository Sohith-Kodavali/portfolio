"use client";

import { gsap } from "@/lib/gsap";

type Tick = (time: number, delta: number) => void;

const subs = new Set<Tick>();
let running = false;

function run(time: number, delta: number) {
  for (const fn of subs) fn(time, delta);
}

/**
 * One animation loop for the whole site.
 *
 * There used to be four independent `requestAnimationFrame` loops running for
 * the entire lifetime of the page — the scroll smear, the cursor, the hero
 * backdrop and the warp tunnel — plus a 500 ms `setInterval` in the shell. Four
 * loops each doing their own frame bookkeeping is four chances to miss a frame,
 * and they are all trying to paint on the same main thread.
 *
 * This rides the GSAP ticker instead, which is already running because Lenis is
 * driven by it. The loop starts on the first subscriber and stops on the last, so
 * a page with nothing animating costs nothing.
 */
export function onTick(fn: Tick) {
  if (!running) {
    gsap.ticker.add(run);
    running = true;
  }
  subs.add(fn);

  return () => {
    subs.delete(fn);
    if (subs.size === 0 && running) {
      gsap.ticker.remove(run);
      running = false;
    }
  };
}
