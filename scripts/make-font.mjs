// Pre-bakes the wordmark font into a three.js typeface JSON.
//
// Why this exists: three r186's TTFLoader imports opentype.js from a jsDelivr
// CDN URL at runtime, which webpack cannot resolve — it fails the build
// outright. Instead we parse the TTF once, here, and ship a static JSON that
// FontLoader reads (FontLoader imports only from three core).
//
// It also subsets: only the glyphs the wordmark actually uses are emitted, so
// the asset is a few KB instead of the ~330 KB TTF, and there is no runtime
// font parsing on the main thread.
//
// Run with `pnpm font`. The source TTF lives in assets/fonts (not in public/,
// so it is never served). If it is missing:
//   https://fonts.google.com/specimen/Pacifico
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const TEXT = "sohith";
const SRC = path.join(process.cwd(), "assets", "fonts", "Pacifico-Regular.ttf");
const OUT = path.join(process.cwd(), "public", "fonts", "pacifico-sohith.json");

if (!fs.existsSync(SRC)) {
  console.error(`missing source font: ${SRC}`);
  console.error("download Pacifico from https://fonts.google.com/specimen/Pacifico");
  process.exit(1);
}

const buf = fs.readFileSync(SRC);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Mirrors three's TTFLoader.convert() so `new Font(json)` behaves identically.
const round = Math.round;
const scale = 100000 / ((font.unitsPerEm || 2048) * 72);
const glyphIndexMap = font.encoding.cmap.glyphIndexMap;
const wanted = new Set([...TEXT].map((c) => c.codePointAt(0)));

const glyphs = {};
let emitted = 0;

for (const unicode of Object.keys(glyphIndexMap)) {
  const cp = Number(unicode);
  if (!wanted.has(cp)) continue;

  const glyph = font.glyphs.glyphs[glyphIndexMap[unicode]];
  if (!glyph) continue;

  const token = {
    ha: round(glyph.advanceWidth * scale),
    x_min: round(glyph.xMin * scale),
    x_max: round(glyph.xMax * scale),
    o: ""
  };

  glyph.path.commands.forEach((command) => {
    if (command.type.toLowerCase() === "c") command.type = "b";
    token.o += command.type.toLowerCase() + " ";
    if (command.x !== undefined && command.y !== undefined) {
      token.o += round(command.x * scale) + " " + round(command.y * scale) + " ";
    }
    if (command.x1 !== undefined && command.y1 !== undefined) {
      token.o += round(command.x1 * scale) + " " + round(command.y1 * scale) + " ";
    }
    if (command.x2 !== undefined && command.y2 !== undefined) {
      token.o += round(command.x2 * scale) + " " + round(command.y2 * scale) + " ";
    }
  });

  glyphs[String.fromCodePoint(cp)] = token;
  emitted++;
}

const missing = [...wanted].filter((cp) => !glyphs[String.fromCodePoint(cp)]);
if (missing.length) {
  console.error(`no glyph for: ${missing.map((c) => String.fromCodePoint(c)).join(", ")}`);
  process.exit(1);
}

const json = {
  glyphs,
  familyName: font.getEnglishName("fullName"),
  ascender: round(font.ascender * scale),
  descender: round(font.descender * scale),
  underlinePosition: font.tables.post.underlinePosition,
  underlineThickness: font.tables.post.underlineThickness,
  boundingBox: {
    xMin: font.tables.head.xMin,
    xMax: font.tables.head.xMax,
    yMin: font.tables.head.yMin,
    yMax: font.tables.head.yMax
  },
  resolution: 1000,
  original_font_information: font.tables.name
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(json));

const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1);
console.log(`wrote ${path.relative(process.cwd(), OUT)}`);
console.log(`  glyphs: ${emitted} (${[...wanted].map((c) => String.fromCodePoint(c)).join(" ")})`);
console.log(`  size:   ${kb(OUT)} KB   (source TTF was ${kb(SRC)} KB)`);
