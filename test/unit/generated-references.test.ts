/**
 * Locks the generated reference pages to their sources.
 *
 * The three reference pages under website/src/content/docs/reference/ are
 * produced by scripts/generate-references.ts from lib/main.tsp, src/lib.ts,
 * and the emitter options interface. This test fails when a page drifts from
 * what the source declares or loses the generated-file banner, so reference
 * docs can never silently disagree with the code they document.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  parseDecorators,
  parseDiagnostics,
  parseOptions,
} from "../../scripts/generate-references.js";
import { $lib } from "../../src/lib.js";

const repoRoot = path.join(import.meta.dirname, "..", "..");
const referenceDir = path.join(
  repoRoot,
  "website",
  "src",
  "content",
  "docs",
  "reference",
);

const GENERATED_BANNER =
  "> **Generated file** — produced by `scripts/generate-references.ts` (`pnpm run references:generate`). Never hand-edit; the drift test fails if this file is stale.";

const PAGE_TITLES: Record<string, string> = {
  "decorators.md": "Decorators",
  "diagnostics.md": "Diagnostics",
  "emitter-options.md": "Emitter options",
};

function expectedPagePrefix(title: string): string {
  return [
    "---",
    `title: ${title}`,
    "description: Generated from source on every run of scripts/generate-references.ts — never hand-edit.",
    "---",
    "",
    GENERATED_BANNER,
    "",
  ].join("\n");
}

function readPage(file: string): string {
  return readFileSync(path.join(referenceDir, file), "utf8");
}

describe("generated reference pages", () => {
  const mainTsp = readFileSync(path.join(repoRoot, "lib", "main.tsp"), "utf8");
  const libTs = readFileSync(path.join(repoRoot, "src", "lib.ts"), "utf8");
  const optionsTs = readFileSync(
    path.join(
      repoRoot,
      "src",
      "infrastructure",
      "configuration",
      "asyncAPIEmitterOptions.ts",
    ),
    "utf8",
  );
  const decorators = parseDecorators(mainTsp);
  const diagnostics = parseDiagnostics(libTs);
  const options = parseOptions(optionsTs);

  it("renders exactly one decorators row per extern dec declaration in lib/main.tsp", () => {
    const externDecCount = (mainTsp.match(/extern\s+dec\b/gu) ?? []).length;
    expect(externDecCount).toBeGreaterThan(0);
    expect(decorators).toHaveLength(externDecCount);

    const rows = (readPage("decorators.md").match(/^\| `@/gmu) ?? []).length;
    expect(rows).toBe(decorators.length);
  });

  it("renders exactly one diagnostics row per registry code", () => {
    const registryCodes = Object.keys($lib.diagnostics).toSorted();
    expect(registryCodes.length).toBeGreaterThan(0);
    expect(diagnostics).toHaveLength(registryCodes.length);

    const pageCodes: string[] = [];
    for (const match of readPage("diagnostics.md").matchAll(
      /^\| `(?<code>[A-Za-z][A-Za-z0-9-]*)` +\| +(?:error|warning) +\|/gmu,
    )) {
      const code = match.groups?.code;
      if (code !== undefined) {
        pageCodes.push(code);
      }
    }
    expect(pageCodes).toHaveLength(registryCodes.length);
    expect(pageCodes.toSorted()).toStrictEqual(registryCodes);
  });

  it("renders exactly one emitter-options row per declared option", () => {
    expect(options.length).toBeGreaterThan(0);
    const rows = (readPage("emitter-options.md").match(/^\| `/gmu) ?? []).length;
    expect(rows).toBe(options.length);
  });

  it("exists for every page and starts with the generated-file frontmatter and banner", () => {
    for (const [file, title] of Object.entries(PAGE_TITLES)) {
      expect(existsSync(path.join(referenceDir, file))).toBe(true);
      const content = readPage(file);
      expect(content.startsWith(expectedPagePrefix(title))).toBe(true);
    }
  });
});
