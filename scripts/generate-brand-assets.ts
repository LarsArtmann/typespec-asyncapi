/**
 * Brand asset generator: ONE geometry definition -> every pipeline artifact.
 *
 * Before this script the same tiles, glyphs, arrow and gradient stops were
 * copy-pasted into six places (two lockup variants, the compact mark, the
 * Starlight logo copy, and two Astro components). Every edit meant six edits,
 * and the copies had already drifted. Now they are all derived from the
 * constants below, and each asset body is assembled by exactly one function.
 *
 *   pnpm run brand:generate   rewrite the artifacts
 *   pnpm run brand:check      fail (exit 1) if any artifact on disk drifted
 *
 * Never hand-edit the generated files; edit this script and regenerate.
 * Run it with bun (`bun run scripts/generate-brand-assets.ts`) like the other
 * scripts in this directory.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");

const TSP_TILE_FILL = "#4A3665";
const INK_ON_DARK = "#EDEFF7";
const INK_ON_LIGHT = "#16131F";

const STATIC_GROTESK = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
const STATIC_MONO =
  "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";
const CSS_VAR_GROTESK =
  "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const CSS_VAR_MONO = "var(--font-jetbrains-mono), 'JetBrains Mono', monospace";

const TSP_GLYPH_TRANSFORM =
  "matrix(15.178627,0,0,10.583627,-3371.045947,-1496.785073)";

const TSP_GLYPH_PATH = [
  "M 223.327 148.108 L 223.327 144.801 L 222.786 144.801 L 222.786 144.213",
  "L 224.44 144.213 L 224.44 144.801 L 223.899 144.801 L 223.899 148.108 Z",
  "M 225.391 148.15 Q 225.156 148.15 224.999 148.072 Q 224.843 147.994",
  "224.753 147.846 Q 224.663 147.697 224.624 147.488 Q 224.586 147.279",
  "224.586 147.016 L 225.148 146.963 Q 225.148 147.09 225.157 147.208",
  "Q 225.166 147.326 225.191 147.42 Q 225.217 147.514 225.266 147.57",
  "Q 225.315 147.626 225.391 147.626 Q 225.519 147.626 225.572 147.508",
  "Q 225.625 147.39 225.625 147.223 Q 225.625 147.056 225.537 146.876",
  "Q 225.45 146.696 225.328 146.534 Q 225.121 146.258 224.966 146.022",
  "Q 224.811 145.787 224.725 145.559 Q 224.639 145.331 224.639 145.082",
  "Q 224.639 144.886 224.689 144.72 Q 224.74 144.554 224.836 144.431",
  "Q 224.933 144.308 225.071 144.239 Q 225.209 144.17 225.386 144.17",
  "Q 225.606 144.17 225.758 144.244 Q 225.911 144.319 226.005 144.456",
  "Q 226.099 144.594 226.143 144.784 Q 226.186 144.973 226.186 145.204",
  "L 225.625 145.257 Q 225.625 145.159 225.615 145.059 Q 225.606 144.96",
  "225.582 144.878 Q 225.558 144.796 225.513 144.745 Q 225.468 144.695",
  "225.397 144.695 Q 225.285 144.695 225.243 144.789 Q 225.201 144.883",
  "225.201 145.055 Q 225.201 145.278 225.32 145.485 Q 225.439 145.691",
  "225.641 145.967 Q 225.882 146.293 226.034 146.566 Q 226.186 146.839",
  "226.186 147.17 Q 226.186 147.379 226.141 147.558 Q 226.096 147.737",
  "226 147.87 Q 225.903 148.002 225.753 148.076 Q 225.603 148.15",
  "225.391 148.15 Z M 226.494 148.108 L 226.494 144.213 L 227.066 144.213",
  "Q 227.392 144.213 227.611 144.356 Q 227.829 144.499 227.938 144.761",
  "Q 228.047 145.023 228.047 145.379 Q 228.047 145.734 227.933 145.991",
  "Q 227.819 146.248 227.6 146.392 Q 227.381 146.537 227.066 146.55",
  "L 227.066 148.108 Z M 227.066 145.967 Q 227.217 145.967 227.305 145.907",
  "Q 227.392 145.848 227.43 145.718 Q 227.469 145.588 227.469 145.384",
  "Q 227.469 145.177 227.43 145.047 Q 227.392 144.917 227.303 144.856",
  "Q 227.214 144.796 227.066 144.796 Z",
].join(" ");

const ASYNCAPI_GLYPHS = [
  '<polygon points="53.35 63.21 49.25 68.86 81.27 92.1 81.49 92.26 85.59 86.61 53.57 63.37 53.35 63.21" />',
  '<polygon points="74.27 63.37 74.05 63.21 69.95 68.86 101.97 92.1 102.19 92.26 106.29 86.61 74.27 63.37" />',
  '<path d="M77.78,34.29c-17.35,0-31.48,10.79-31.48,24.06v.27h7v-.27c0-9.42,11-17.08,24.5-17.08s24.51,7.66,24.51,17.08v.27h7v-.27C109.27,45.08,95.14,34.29,77.78,34.29Z" />',
  '<path d="M102.23,97.16c0,9.42-11,17.08-24.51,17.08s-24.5-7.66-24.5-17.08v-.27h-7v.27c0,13.26,14.13,24,31.48,24s31.49-10.79,31.49-24v-.27h-7Z" />',
];

interface GradientStop {
  readonly offset: string;
  readonly color: string;
}

const ASYNCAPI_GRADIENT: readonly GradientStop[] = [
  { offset: "0", color: "#2DCCFD" },
  { offset: "0.5", color: "#A829E2" },
  { offset: "1", color: "#E50E99" },
];

const EMIT_BLOCK_GRADIENT: readonly GradientStop[] = [
  { offset: "0", color: "#7C3AED" },
  { offset: "1", color: "#5B21B6" },
];

const AA_GRADIENT_ATTRS = 'x1="1" y1="0" x2="0" y2="1"';
const BLOCK_GRADIENT_ATTRS = 'x1="0" y1="0" x2="1" y2="1"';
const ARROW_GRADIENT_ATTRS =
  'gradientUnits="userSpaceOnUse" x1="26" y1="18" x2="46" y2="18"';

const GENERATED_NOTICE = [
  "// GENERATED FILE - do not edit by hand.",
  "// Source: scripts/generate-brand-assets.ts (run `pnpm run brand:generate`).",
].join("\n");

/**
 * How the components point at their per-instance gradients. These strings are
 * emitted verbatim into the `.astro` files, so they hold the Astro expression.
 */
const COMPONENT_AA_FILL = '{"url(#" + aaId + ")"}';
const COMPONENT_BLOCK_FILL = '{"url(#" + blockId + ")"}';
const COMPONENT_ARROW_FILL = '{"url(#" + arrowId + ")"}';

function pad(depth: number): string {
  return "  ".repeat(depth);
}

function indent(lines: readonly string[], depth: number): string[] {
  return lines.map((line) => pad(depth) + line);
}

/** Attribute values are passed fully quoted, so an Astro expression can be
 * substituted for a literal without the caller adding quotes. */
function quote(value: string): string {
  return `"${value}"`;
}

function groupElement(
  openingTag: string,
  glyphs: readonly string[],
  depth: number,
): string {
  return [openingTag, ...indent(glyphs, 1), "</g>"]
    .map((line) => pad(depth) + line)
    .join("\n");
}

function tspGlyphs(): string[] {
  return [
    `<rect width="100" height="100" fill="${TSP_TILE_FILL}" />`,
    `<path transform="${TSP_GLYPH_TRANSFORM}" d="${TSP_GLYPH_PATH}" fill="#FFFFFF" />`,
  ];
}

function asyncApiGlyphs(depth: number): string[] {
  return groupElement(
    '<g transform="scale(0.643)" fill="#FFFFFF">',
    ASYNCAPI_GLYPHS,
    depth,
  ).split("\n");
}

function tileAt(
  body: readonly string[],
  depth: number,
  x: number,
  y: number,
  scale: number,
): string[] {
  return groupElement(
    `<g transform="translate(${x} ${y}) scale(${scale})">`,
    body,
    depth,
  ).split("\n");
}

function asyncApiTileBody(fill: string): string[] {
  return [
    `<rect width="100" height="100" rx="21" fill=${fill} />`,
    ...asyncApiGlyphs(0),
  ];
}

interface GradientRef {
  /** The whole id attribute: quoted for static SVGs, an expression in Astro. */
  readonly id: string;
  /** The remaining `<linearGradient>` attributes. */
  readonly direction: string;
  readonly stops: readonly GradientStop[];
}

function gradientRef(
  id: string,
  direction: string,
  stops: readonly GradientStop[],
): GradientRef {
  return { id, direction, stops };
}

/**
 * The AsyncAPI gradient is on every asset, so only the second gradient is
 * described at each call site.
 */
function defsBlock(
  depth: number,
  asyncApiId: string,
  second: GradientRef,
): string[] {
  return [
    `${pad(depth)}<defs>`,
    ...gradientElement(
      `${asyncApiId} ${AA_GRADIENT_ATTRS}`,
      ASYNCAPI_GRADIENT,
      depth + 1,
    ),
    ...gradientElement(
      `${second.id} ${second.direction}`,
      second.stops,
      depth + 1,
    ),
    `${pad(depth)}</defs>`,
  ];
}

function gradientElement(
  attributes: string,
  stops: readonly GradientStop[],
  depth: number,
): string[] {
  return [
    `${pad(depth)}<linearGradient ${attributes}>`,
    ...stops.map(
      ({ offset, color }) =>
        `${pad(depth + 1)}<stop offset="${offset}" stop-color="${color}" />`,
    ),
    `${pad(depth)}</linearGradient>`,
  ];
}

interface LockupOptions {
  readonly aaFill: string;
  readonly blockFill: string;
  readonly tspCaptionFill: string;
  readonly aaCaptionFill: string;
  readonly grotesk: string;
  readonly mono: string;
  readonly depth: number;
}

interface Slot {
  readonly x: number;
  readonly y: number;
}

/**
 * One composition of the same atoms: two captioned tiles with the emit block
 * between them. The stacked lockup runs top-to-bottom and the horizontal one
 * left-to-right; they share every metric, so only the slots move.
 */
interface LockupLayout {
  /** Keeps SVG element ids distinct when two lockups share a page. */
  readonly slug: string;
  /** Artifact basename, e.g. `lockup-horizontal`. */
  readonly fileStem: string;
  readonly width: number;
  readonly height: number;
  readonly tsp: Slot;
  readonly pill: Slot;
  readonly asyncApi: Slot;
}

const STACKED_LOCKUP: LockupLayout = {
  slug: "Stacked",
  fileStem: "lockup-stacked",
  width: 126,
  height: 112,
  tsp: { x: 6, y: 6 },
  pill: { x: 6, y: 44 },
  asyncApi: { x: 6, y: 76 },
};

/** The stacked lockup unfolded into one row for wide slots (README banner). */
const HORIZONTAL_LOCKUP: LockupLayout = {
  slug: "Horizontal",
  fileStem: "lockup-horizontal",
  width: 352,
  height: 54,
  tsp: { x: 6, y: 12 },
  pill: { x: 130, y: 15 },
  asyncApi: { x: 230, y: 12 },
};

const LOCKUP_LAYOUTS: readonly LockupLayout[] = [
  STACKED_LOCKUP,
  HORIZONTAL_LOCKUP,
];

const LOCKUP_TILE_SCALE = 0.3;
const CAPTION_LEAD = 38;
const CAPTION_RISE = 21;
const EMIT_PILL_WIDTH = 88;
const EMIT_PILL_HEIGHT = 24;

function tspTile(depth: number, slot: Slot): string[] {
  return tileAt(tspGlyphs(), depth, slot.x, slot.y, LOCKUP_TILE_SCALE);
}

function asyncApiTile(depth: number, slot: Slot, fill: string): string[] {
  return tileAt(asyncApiTileBody(fill), depth, slot.x, slot.y, LOCKUP_TILE_SCALE);
}

function caption(
  depth: number,
  slot: Slot,
  fill: string,
  family: string,
  text: string,
): string[] {
  const x = slot.x + CAPTION_LEAD;
  const y = slot.y + CAPTION_RISE;
  return [
    `${pad(depth)}<text x="${x}" y="${y}" font-family="${family}" font-size="17" font-weight="700" letter-spacing="-0.3" fill=${fill}>${text}</text>`,
  ];
}

function emitPill(
  depth: number,
  slot: Slot,
  fill: string,
  family: string,
): string[] {
  const centerY = slot.y + EMIT_PILL_HEIGHT / 2;
  return [
    `${pad(depth)}<rect x="${slot.x}" y="${slot.y}" width="${EMIT_PILL_WIDTH}" height="${EMIT_PILL_HEIGHT}" rx="5" fill=${fill} />`,
    `${pad(depth)}<path d="M${slot.x + 14} ${centerY}H${slot.x + 28}M${slot.x + 23.5} ${centerY - 4.5}L${slot.x + 28} ${centerY}L${slot.x + 23.5} ${centerY + 4.5}" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />`,
    `${pad(depth)}<text x="${slot.x + 36}" y="${centerY + 4}" font-family="${family}" font-size="11" font-weight="700" letter-spacing="1.5" fill="#FFFFFF">EMITS</text>`,
  ];
}

function lockupBody(options: LockupOptions, layout: LockupLayout): string[] {
  const {
    aaFill,
    blockFill,
    tspCaptionFill,
    aaCaptionFill,
    grotesk,
    mono,
    depth,
  } = options;
  return [
    ...tspTile(depth, layout.tsp),
    ...caption(depth, layout.tsp, tspCaptionFill, grotesk, "TypeSpec"),
    ...emitPill(depth, layout.pill, blockFill, mono),
    ...asyncApiTile(depth, layout.asyncApi, aaFill),
    ...caption(depth, layout.asyncApi, aaCaptionFill, grotesk, "AsyncAPI"),
  ];
}

interface MarkOptions {
  readonly aaFill: string;
  readonly arrowFill: string;
  readonly depth: number;
}

function markBody(options: MarkOptions): string[] {
  const { aaFill, arrowFill, depth } = options;
  return [
    ...tileAt(tspGlyphs(), depth, 0, 5, 0.26),
    `${pad(depth)}<path d="M30 18H40" stroke=${arrowFill} stroke-width="4" stroke-linecap="round" />`,
    `${pad(depth)}<polygon points="40,12 48,18 40,24" fill=${arrowFill} />`,
    ...tileAt(asyncApiTileBody(aaFill), depth, 46, 5, 0.26),
  ];
}

function wrapSvg(attributes: string, inner: readonly string[]): string {
  return `${[`<svg ${attributes}>`, ...inner, "</svg>"].join("\n")}\n`;
}

function renderLockupSvg(
  layout: LockupLayout,
  variant: "dark" | "light",
): string {
  const ink = variant === "dark" ? INK_ON_DARK : INK_ON_LIGHT;
  const suffix = variant === "dark" ? "Dark" : "Light";
  const prefix = `taaLockup${layout.slug}${suffix}`;
  const aaFill = quote(`url(#${prefix}Aa)`);
  const blockFill = quote(`url(#${prefix}Block)`);
  return wrapSvg(
    `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" role="img" aria-labelledby="${prefix}Title"`,
    [
      `<title id="${prefix}Title">TypeSpec emits AsyncAPI</title>`,
      ...defsBlock(
        0,
        `id="${prefix}Aa"`,
        gradientRef(
          `id="${prefix}Block"`,
          BLOCK_GRADIENT_ATTRS,
          EMIT_BLOCK_GRADIENT,
        ),
      ),
      ...lockupBody(
        {
          aaFill,
          blockFill,
          tspCaptionFill: quote(ink),
          aaCaptionFill: aaFill,
          grotesk: STATIC_GROTESK,
          mono: STATIC_MONO,
          depth: 0,
        },
        layout,
      ),
    ],
  );
}

function renderMarkSvg(): string {
  const aaFill = quote("url(#taaMarkAa)");
  return wrapSvg(
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 36" width="72" height="36" role="img" aria-labelledby="taaMarkTitle"',
    [
      '<title id="taaMarkTitle">TypeSpec emits AsyncAPI</title>',
      ...defsBlock(
        0,
        'id="taaMarkAa"',
        gradientRef(
          'id="taaMarkArrow"',
          ARROW_GRADIENT_ATTRS,
          ASYNCAPI_GRADIENT,
        ),
      ),
      ...markBody({
        aaFill,
        arrowFill: quote("url(#taaMarkArrow)"),
        depth: 0,
      }),
    ],
  );
}

interface ComponentParts {
  readonly frontmatter: readonly string[];
  readonly svgAttributes: readonly string[];
  readonly inner: readonly string[];
}

function componentInner(
  depth: number,
  asyncApiId: string,
  second: GradientRef,
  body: readonly string[],
): string[] {
  return [...defsBlock(depth, asyncApiId, second), ...body];
}

function componentFile(parts: ComponentParts): string {
  return `${[
    "---",
    GENERATED_NOTICE,
    ...parts.frontmatter,
    "---",
    "",
    "<svg",
    ...indent(parts.svgAttributes, 1),
    ">",
    ...parts.inner,
    "</svg>",
    "",
  ].join("\n")}`;
}

function renderLogoComponent(): string {
  return componentFile({
    frontmatter: [
      "export interface Props {",
      "  width?: number;",
      "  height?: number;",
      "  class?: string;",
      "  id?: string;",
      "  decorative?: boolean;",
      "}",
      "",
      "const {",
      "  width = 44,",
      "  height = 22,",
      "  class: className,",
      '  id = "default",',
      "  decorative = false,",
      "} = Astro.props;",
      "",
      'const aaId = "taa-mark-aa-" + id;',
      'const arrowId = "taa-mark-arrow-" + id;',
    ],
    svgAttributes: [
      "class={className}",
      "width={width}",
      "height={height}",
      'viewBox="0 0 72 36"',
      'xmlns="http://www.w3.org/2000/svg"',
      'role={decorative ? undefined : "img"}',
      'aria-label={decorative ? undefined : "TypeSpec emits AsyncAPI"}',
      'aria-hidden={decorative ? "true" : undefined}',
    ],
    inner: componentInner(
      1,
      "id={aaId}",
      gradientRef("id={arrowId}", ARROW_GRADIENT_ATTRS, ASYNCAPI_GRADIENT),
      markBody({
        aaFill: COMPONENT_AA_FILL,
        arrowFill: COMPONENT_ARROW_FILL,
        depth: 1,
      }),
    ),
  });
}

function renderLockupComponent(): string {
  return componentFile({
    frontmatter: [
      "export interface Props {",
      "  height?: number;",
      "  class?: string;",
      "  id?: string;",
      "}",
      "",
      `const { height = ${STACKED_LOCKUP.height}, class: className, id = "default" } = Astro.props;`,
      "",
      `const width = Math.round((height * ${STACKED_LOCKUP.width}) / ${STACKED_LOCKUP.height});`,
      'const aaId = "taa-lockup-aa-" + id;',
      'const blockId = "taa-lockup-block-" + id;',
    ],
    svgAttributes: [
      "class={className}",
      "width={width}",
      "height={height}",
      `viewBox="0 0 ${STACKED_LOCKUP.width} ${STACKED_LOCKUP.height}"`,
      'xmlns="http://www.w3.org/2000/svg"',
      'role="img"',
      'aria-label="TypeSpec emits AsyncAPI"',
    ],
    inner: componentInner(
      1,
      "id={aaId}",
      gradientRef("id={blockId}", BLOCK_GRADIENT_ATTRS, EMIT_BLOCK_GRADIENT),
      lockupBody(
        {
          aaFill: COMPONENT_AA_FILL,
          blockFill: COMPONENT_BLOCK_FILL,
          tspCaptionFill: '"currentColor"',
          aaCaptionFill: COMPONENT_AA_FILL,
          grotesk: CSS_VAR_GROTESK,
          mono: CSS_VAR_MONO,
          depth: 1,
        },
        STACKED_LOCKUP,
      ),
    ),
  });
}

interface Artifact {
  readonly relativePath: string;
  readonly content: string;
}

const markSvg = renderMarkSvg();

const lockupArtifacts: Artifact[] = LOCKUP_LAYOUTS.flatMap((layout) =>
  (["dark", "light"] as const).map((variant) => ({
    relativePath: `assets/brand/${layout.fileStem}-${variant}.svg`,
    content: renderLockupSvg(layout, variant),
  })),
);

const artifacts: Artifact[] = [
  ...lockupArtifacts,
  { relativePath: "assets/brand/mark.svg", content: markSvg },
  { relativePath: "website/src/assets/brand-mark.svg", content: markSvg },
  {
    relativePath: "website/src/components/Logo.astro",
    content: renderLogoComponent(),
  },
  {
    relativePath: "website/src/components/PipelineLockup.astro",
    content: renderLockupComponent(),
  },
];

const checkOnly = process.argv.includes("--check");
const drifted: string[] = [];

for (const artifact of artifacts) {
  const absolutePath = path.join(repoRoot, artifact.relativePath);
  const current = existsSync(absolutePath)
    ? readFileSync(absolutePath, "utf8")
    : undefined;

  if (current === artifact.content) {
    continue;
  }
  if (checkOnly) {
    drifted.push(
      current === undefined
        ? `${artifact.relativePath} (missing)`
        : `${artifact.relativePath} (differs)`,
    );
    continue;
  }
  writeFileSync(absolutePath, artifact.content, "utf8");
  console.log(`wrote ${artifact.relativePath}`);
}

if (checkOnly) {
  if (drifted.length > 0) {
    console.error("Brand assets are out of date:");
    for (const entry of drifted) {
      console.error(`  - ${entry}`);
    }
    console.error("Run `pnpm run brand:generate` and commit the result.");
    process.exit(1);
  }
  console.log(`brand assets up to date (${artifacts.length} files)`);
}
