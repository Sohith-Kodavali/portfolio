"use client";

export type RectEntry = {
  el: HTMLElement;
  /** Viewport-space rect, corrected by the scroll delta each frame. */
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  measured: boolean;
};

/**
 * Tracks a set of DOM elements' viewport rectangles without a layout read per
 * element per frame.
 *
 * Reading `getBoundingClientRect()` for every card every frame is the obvious
 * approach and the wrong one — it forces layout and the cost grows with the
 * number of cards. Instead the cache is corrected by the scroll delta (scroll
 * moves a rect without changing layout), and only re-measured for real when the
 * card is near the viewport or on its staggered turn. That keeps a long grid
 * aligned after a layout change without bunching every DOM read into one frame.
 *
 * Runs before its consumers in the frame, so a nearby card reads a rect that is
 * fresh for the frame being drawn.
 */
export class DomRectSampler {
  private entries = new Map<HTMLElement, RectEntry>();
  private lastScroll = 0;
  private frame = 0;

  register(el: HTMLElement) {
    if (this.entries.has(el)) return;
    this.entries.set(el, {
      el,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      measured: false
    });
  }

  /** Clears the set and re-registers from a selector, e.g. after a re-render. */
  reset(selector: string) {
    this.entries.clear();
    if (typeof document === "undefined") return;
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => this.register(el));
  }

  get size() {
    return this.entries.size;
  }

  values() {
    return this.entries.values();
  }

  /** Call once per frame, before any consumer reads a rect. */
  sample(scrollTop: number, viewportHeight: number) {
    const delta = scrollTop - this.lastScroll;
    this.lastScroll = scrollTop;
    let index = 0;
    for (const entry of this.entries.values()) {
      // Scroll moves a cached rect but does not change layout, so adjust it in
      // place instead of re-reading it.
      if (entry.measured) {
        entry.top -= delta;
        entry.bottom -= delta;
      }
      const near =
        entry.measured &&
        entry.bottom > -viewportHeight * 0.25 &&
        entry.top < viewportHeight * 1.25;
      const staggered = this.frame % 12 === index % 12;
      if (!entry.measured || near || staggered) {
        const rect = entry.el.getBoundingClientRect();
        entry.left = rect.left;
        entry.top = rect.top;
        entry.right = rect.right;
        entry.bottom = rect.bottom;
        entry.width = rect.width;
        entry.height = rect.height;
        entry.measured = true;
      }
      index += 1;
    }
    this.frame += 1;
  }
}
