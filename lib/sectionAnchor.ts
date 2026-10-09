"use client";

import { getScrollY } from "./scroll";

export type SectionLayout = {
  /** Distance from the top of the document to the section's top edge, in px. */
  topDocY: number;
  /** The section's height, in px. */
  height: number;
};

/** Measures a section's position and size in document space. */
export function readSectionLayout(el: HTMLElement): SectionLayout {
  const rect = el.getBoundingClientRect();
  return { topDocY: rect.top + getScrollY(), height: rect.height };
}

/**
 * Converts a section's document anchor into a world-space Y for the WebGL shell.
 *
 * The reference does not transform the page; it anchors its models to the DOM
 * sections in world units and lets the camera move through them. This is the
 * world-unit half of that: a section sits at a world Y derived from where its
 * centre is in the document, and travels with scroll at a rate expressed in
 * viewport world heights rather than in raw pixels.
 *
 * `scrollSyncFactor` below 1 lets the content lag the DOM slightly. The
 * reference banner uses 0.72 — the content moves at 72% of scroll, so it trails
 * the page a touch and gives the scene depth as the camera dollies back.
 */
export function scrollSyncedWorldY({
  layout,
  scrollTop,
  viewportHeight,
  viewportWorldHeight,
  scrollSyncFactor = 1
}: {
  layout: SectionLayout;
  scrollTop: number;
  viewportHeight: number;
  viewportWorldHeight: number;
  scrollSyncFactor?: number;
}) {
  const vh = Math.max(1, viewportHeight);
  const anchorDocY = layout.topDocY + layout.height * 0.5;
  return (
    (0.5 - anchorDocY / vh) * viewportWorldHeight +
    (scrollTop / vh) * viewportWorldHeight * scrollSyncFactor
  );
}
