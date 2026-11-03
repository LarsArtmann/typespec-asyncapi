import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { playgroundExamples } from "../../website/src/data/playground.js";
import {
  highlightTypeSpec,
  highlightYaml,
} from "../../website/src/lib/highlight.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const componentPath = join(
  import.meta.dirname,
  "../../website/src/components/PlaygroundSection.astro",
);
const component = readFileSync(componentPath, "utf8");

const plainText = (html: string): string =>
  html
    .replaceAll(/<span class="[^"]*">/gu, "")
    .replaceAll("</span>", "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

/**
 * The example chips read their sources with
 * `root.querySelectorAll("[data-example-source]")`, so the hidden source
 * <pre> elements MUST live inside the `[data-playground]` root div. They
 * once sat outside it, which made every chip except the default silently
 * do nothing. This finds the root div's full extent by counting <div>
 * depth and asserts the sources map is rendered inside it.
 */
function playgroundRootRegion(source: string): { open: number; close: number } {
  const open = source.indexOf("<div\n  data-playground\n");
  expect(open).toBeGreaterThan(-1);
  let depth = 0;
  for (const match of source.slice(open).matchAll(/<\/?div\b/gu)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      return { open, close: open + (match.index ?? 0) };
    }
  }
  throw new Error("unbalanced <div> tags in PlaygroundSection.astro");
}

describe("playground UI wiring", () => {
  it("renders the example sources inside the [data-playground] root", () => {
    const { open, close } = playgroundRootRegion(component);
    const sourcesAt = component.indexOf("data-example-source=");
    expect(sourcesAt).toBeGreaterThan(open);
    expect(sourcesAt).toBeLessThan(close);
  });

  it("highlights through the shared hero highlighter, not a private copy", () => {
    expect(component).toContain('from "../lib/highlight"');
    expect(component).toContain("data-playground-highlight");
    expect(component).not.toContain("/js/playground.js");
    expect(
      existsSync(
        join(import.meta.dirname, "../../website/public/js/playground.js"),
      ),
    ).toBeFalsy();
  });
});

describe("playground highlighting round-trips", () => {
  it("preserves every playground example source exactly", () => {
    for (const example of playgroundExamples) {
      expect(plainText(highlightTypeSpec(example.source))).toBe(
        example.source,
      );
    }
  });

  it("preserves the real emitted AsyncAPI YAML exactly", async () => {
    const example = playgroundExamples[0]!;
    const result = await compileAsyncAPI(example.source);
    const emitted = result.allOutputFiles.get("asyncapi.yaml") ?? "";
    expect(emitted).toContain("asyncapi:");
    expect(plainText(highlightYaml(emitted))).toBe(emitted);
  });

  it("escapes markup injected through the editor", () => {
    const html = highlightTypeSpec("<img src=x onerror=alert(1)>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
