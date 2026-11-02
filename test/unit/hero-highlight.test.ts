import { heroAsyncAPI, heroTypeSpec } from "../../website/src/data/hero.js";
import {
  highlightTypeSpec,
  highlightYaml,
} from "../../website/src/lib/highlight.js";

const plainText = (html: string): string =>
  html
    .replaceAll(/<span class="[^"]*">/gu, "")
    .replaceAll("</span>", "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

describe("hero code highlighting", () => {
  it("preserves the YAML document exactly", () => {
    expect(plainText(highlightYaml(heroAsyncAPI))).toBe(heroAsyncAPI);
  });

  it("preserves the TypeSpec source exactly", () => {
    expect(plainText(highlightTypeSpec(heroTypeSpec))).toBe(heroTypeSpec);
  });

  it("colours keys and values without leaving raw markup", () => {
    const html = highlightYaml(heroAsyncAPI);
    expect(html).toContain('<span class="text-accent">');
    expect(html).toContain('<span class="text-amber">');
    expect(html).not.toMatch(/<\/?(?:div|code|pre)/u);
  });

  it("escapes angle brackets so a fixture can never inject markup", () => {
    const html = highlightTypeSpec("model A { x: string; } // <script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
