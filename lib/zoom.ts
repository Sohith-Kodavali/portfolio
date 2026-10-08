// Shared, render-free state the WebGL shell reads each frame.

export const stage = {
  /** 0 → 1 as the hero scrolls out — drives the pointer's exit */
  heroExit: 0,
  /** 0 → 1 through the pinned warp transition */
  warp: 0,
  /** true while the transition owns the screen (keeps the canvas awake) */
  warping: false,
  /** true whenever the transition section is on screen, even at warp 0 */
  transitionVisible: false
};

export function setHeroExit(v: number) {
  stage.heroExit = v;
}

export function setWarp(v: number) {
  stage.warp = v;
  // Tracks whether the WebGL shell needs to be rendering at all.
  stage.warping = v > 0.001 && v < 0.999;
}
