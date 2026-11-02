/**
 * Rasterise the pipeline mark for renderers that cannot decode SVG.
 *
 * astro-og-canvas draws Open Graph cards with CanvasKit, which has no SVG
 * decoder, so the social cards need a PNG of the same mark. This script is the
 * only supported way to produce it (an uncommitted /tmp script made the
 * previous one).
 *
 * Run from the repo root via `pnpm run brand:generate`, or directly with
 * `pnpm --filter typespec-asyncapi-website run brand:png`.
 *
 * The output is 2x the size the OG card displays, so it stays crisp on
 * high-density screens.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const websiteRoot = path.join(import.meta.dirname, "..");
const sourceSvg = path.join(websiteRoot, "..", "assets", "brand", "mark.svg");
const targetPng = path.join(websiteRoot, "public", "brand-mark.png");

const WIDTH = 440;
const HEIGHT = 220;

const svg = await readFile(sourceSvg);
const png = await sharp(svg, { density: 300 })
  .resize(WIDTH, HEIGHT, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(targetPng, png);

const { width, height, channels } = await sharp(png).metadata();
console.log(
  `wrote ${path.relative(process.cwd(), targetPng)} ` +
    `(${width}x${height}, ${channels} channels, ${png.byteLength} bytes)`,
);
