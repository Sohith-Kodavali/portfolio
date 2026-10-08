// Live palette the WebGL canvas eases toward. Sections (e.g. Work) push new
// colours in as they come into view so the background responds to content.

export type ThemeColors = {
  a: [number, number, number];
  b: [number, number, number];
  freq: number;
  warp: number;
};

export const liveTheme = {
  current: {
    a: [0.78, 1.0, 0.24],
    b: [0.03, 0.06, 0.05],
    freq: 2.4,
    warp: 1.7
  } as ThemeColors,
  target: null as ThemeColors | null
};

export function setTheme(colors: ThemeColors) {
  liveTheme.target = colors;
}

export type ProjectColors = {
  c1: [number, number, number];
  c2: [number, number, number];
  freq: number;
  warp: number;
};

export function setThemeFromProject(colors: ProjectColors) {
  liveTheme.target = { a: colors.c1, b: colors.c2, freq: colors.freq, warp: colors.warp };
}

export function clearTheme() {
  liveTheme.target = null;
}
