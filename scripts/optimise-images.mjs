// Compresses the images in public/work in place, and emits a .webp sibling of
// each. Run with `pnpm images`.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "work");
const MAX_WIDTH = 1920;

const files = fs.readdirSync(DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
if (!files.length) {
  console.log("no png/jpg files in public/work");
  process.exit(0);
}

const kb = (n) => `${Math.round(n / 1024)}KB`;
let before = 0;
let after = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const sizeBefore = fs.statSync(src).size;
  before += sizeBefore;

  const base = sharp(src).rotate();
  const meta = await base.metadata();
  const needsResize = (meta.width ?? 0) > MAX_WIDTH;
  const resized = needsResize ? base.resize({ width: MAX_WIDTH }) : base;

  const isPng = /\.png$/i.test(file);
  const encoded = await resized
    .clone()
    [isPng ? "png" : "jpeg"](
      isPng
        ? { quality: 82, compressionLevel: 9, effort: 10, palette: false }
        : { quality: 80, mozjpeg: true }
    )
    .toBuffer();

  // Only replace the original if the re-encode actually helped.
  if (encoded.byteLength < sizeBefore) fs.writeFileSync(src, encoded);

  const webpPath = src.replace(/\.(png|jpe?g)$/i, ".webp");
  await resized.clone().webp({ quality: 80, effort: 6 }).toFile(webpPath);

  const sizeAfter = fs.statSync(src).size;
  const webpSize = fs.statSync(webpPath).size;
  after += sizeAfter;

  console.log(
    `${file}  ${kb(sizeBefore)} -> ${kb(sizeAfter)} png${
      needsResize ? ` (resized to ${MAX_WIDTH}px)` : ""
    }, ${kb(webpSize)} webp`
  );
}

console.log(`\ntotal ${kb(before)} -> ${kb(after)} (png) / ${kb(after)} + webp siblings`);
