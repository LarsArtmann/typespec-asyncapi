/**
 * Brand asset invariants.
 *
 * The brand SVGs are generated (`scripts/generate-brand-assets.ts`), so byte
 * comparison already covers "on disk matches the generator". These tests cover
 * what bytes cannot: that references resolve inside their own file, that the
 * two orientations really share their metrics, that the README points at files
 * that exist, and that two bugs already shipped once cannot come back — an
 * invisible gradient arrow and a caption running past the viewBox.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..", "..");

interface LockupFixture {
  readonly file: string;
  readonly width: number;
  readonly height: number;
}

const LOCKUPS: readonly LockupFixture[] = [
  {
    file: "assets/brand/lockup-horizontal-dark.svg",
    width: 352,
    height: 54,
  },
  {
    file: "assets/brand/lockup-horizontal-light.svg",
    width: 352,
    height: 54,
  },
  { file: "assets/brand/lockup-stacked-dark.svg", width: 126, height: 112 },
  { file: "assets/brand/lockup-stacked-light.svg", width: 126, height: 112 },
];

/**
 * Widest `AsyncAPI` caption measured across the fonts this lockup can render
 * with (DejaVu Sans Bold fallback, when Space Grotesk is absent). Used as a
 * clipping budget; re-measure if the caption font or size changes.
 */
const CAPTION_WIDTH_BUDGET = 76;

function readAsset(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function idsIn(svg: string): string[] {
  return [...svg.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1]);
}

function urlRefsIn(svg: string): string[] {
  return [...svg.matchAll(/url\(#([^)]+)\)/gu)].map((match) => match[1]);
}

function tilesIn(svg: string): { x: number; y: number }[] {
  return [
    ...svg.matchAll(/translate\(([\d.]+) ([\d.]+)\) scale\(0\.3\)/gu),
  ].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
}

function captionsIn(svg: string): { x: number; y: number; text: string }[] {
  return [
    ...svg.matchAll(
      /<text x="([\d.]+)" y="([\d.]+)" [^>]*font-size="17"[^>]*>([^<]+)<\/text>/gu,
    ),
  ].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    text: match[3],
  }));
}

describe("brand lockups", () => {
  it.each(LOCKUPS)(
    "$file is a self-contained svg",
    ({ file, width, height }) => {
      const svg = readAsset(file);

      expect(svg.startsWith("<svg ")).toBeTruthy();
      expect(svg.endsWith("</svg>\n")).toBeTruthy();
      expect(svg).toContain(
        `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"`,
      );
      expect(
        svg.match(/<title id="[^"]+">TypeSpec emits AsyncAPI<\/title>/u),
      ).not.toBeNull();

      const titleId = /aria-labelledby="([^"]+)"/u.exec(svg)?.[1];
      expect(titleId).toBeTruthy();
      expect(idsIn(svg)).toContain(titleId);
    },
  );

  it.each(LOCKUPS)("$file resolves every paint reference", ({ file }) => {
    const svg = readAsset(file);
    const ids = idsIn(svg);

    expect(new Set(ids).size).toBe(ids.length);
    for (const reference of urlRefsIn(svg)) {
      expect(ids).toContain(reference);
    }
    expect(urlRefsIn(svg).length).toBeGreaterThan(0);
  });

  it.each(LOCKUPS)(
    "$file shares caption metrics between both tiles",
    ({ file }) => {
      const svg = readAsset(file);
      const tiles = tilesIn(svg);
      const captions = captionsIn(svg);

      expect(tiles).toHaveLength(2);
      expect(captions).toHaveLength(2);
      const [firstTile, secondTile] = tiles;
      const [firstCaption, secondCaption] = captions;
      expect(firstCaption?.text).toBe("TypeSpec");
      expect(secondCaption?.text).toBe("AsyncAPI");
      expect(firstCaption?.x).toBe((firstTile?.x ?? 0) + 38);
      expect(firstCaption?.y).toBe((firstTile?.y ?? 0) + 21);
      expect(secondCaption?.x).toBe((secondTile?.x ?? 0) + 38);
      expect(secondCaption?.y).toBe((secondTile?.y ?? 0) + 21);
      expect(svg.match(/EMITS<\/text>/gu)).toHaveLength(1);
    },
  );

  it.each(LOCKUPS)(
    "$file keeps its captions inside the viewBox",
    ({ file, width, height }) => {
      const svg = readAsset(file);
      const tiles = tilesIn(svg);
      const captions = captionsIn(svg);
      const lastCaption = captions.at(-1);

      expect((lastCaption?.x ?? 0) + CAPTION_WIDTH_BUDGET).toBeLessThanOrEqual(
        width,
      );
      const lastTile = tiles.at(-1);
      expect((lastTile?.y ?? 0) + 30).toBeLessThanOrEqual(height);
    },
  );

  it("gives the two orientations different shapes", () => {
    const [horizontal] = LOCKUPS;
    const stacked = LOCKUPS.at(2);

    expect(
      (horizontal?.width ?? 0) / (horizontal?.height ?? 1),
    ).toBeGreaterThan(4);
    expect((stacked?.width ?? 0) / (stacked?.height ?? 1)).toBeLessThan(2);
  });
});

describe("compact mark", () => {
  it("paints the arrow with a user-space gradient", () => {
    const svg = readAsset("assets/brand/mark.svg");
    const arrowGradient = /<linearGradient id="taaMarkArrow"[^>]*>/u.exec(
      svg,
    )?.[0];

    expect(arrowGradient).toContain('gradientUnits="userSpaceOnUse"');
    expect(svg).toContain('stroke="url(#taaMarkArrow)"');
    expect(svg).toContain('fill="url(#taaMarkArrow)"');
  });

  it("keeps the bundled website copy byte-identical", () => {
    expect(readAsset("website/src/assets/brand-mark.svg")).toBe(
      readAsset("assets/brand/mark.svg"),
    );
  });
});

describe("readme hero", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

  it("uses the horizontal lockup", () => {
    expect(readme).toContain("assets/brand/lockup-horizontal-dark.svg");
    expect(readme).toContain("assets/brand/lockup-horizontal-light.svg");
  });

  it("references brand files that exist", () => {
    const referenced = [
      ...readme.matchAll(
        /raw\.githubusercontent\.com\/LarsArtmann\/typespec-asyncapi\/master\/([^"'\s]+)/gu,
      ),
    ].map((match) => match[1]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const relativePath of referenced) {
      expect(existsSync(path.join(repoRoot, relativePath ?? ""))).toBe(true);
    }
  });
});
