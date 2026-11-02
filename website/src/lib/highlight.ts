/**
 * Minimal, dependency-free syntax highlighting for the two code panes on the
 * landing page. Both panes render the REAL fixture from `data/hero.ts`, so the
 * colouring has to happen at build time here rather than being baked into a
 * hand-written HTML string.
 */

interface HighlightRule {
  pattern: string;
  className: string;
}

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function highlight(code: string, rules: HighlightRule[]): string {
  const master = new RegExp(
    rules.map((rule) => `(${rule.pattern})`).join("|"),
    "gu",
  );

  return code
    .split("\n")
    .map((line) => {
      let html = "";
      let cursor = 0;
      for (const match of line.matchAll(master)) {
        const group = match.slice(1).findIndex((value) => value !== undefined);
        const rule = rules[group];
        if (match.index === undefined || rule === undefined) continue;
        html += escapeHtml(line.slice(cursor, match.index));
        html += `<span class="${rule.className}">${escapeHtml(match[0])}</span>`;
        cursor = match.index + match[0].length;
      }
      return html + escapeHtml(line.slice(cursor));
    })
    .join("\n");
}

const TYPESPEC_RULES: HighlightRule[] = [
  { pattern: '"[^"\\n]*"', className: "text-amber" },
  { pattern: "@[\\w.]+", className: "text-text-muted" },
  {
    pattern: "\\b(?:import|using|namespace|model|op|extends)\\b",
    className: "text-accent-light",
  },
  {
    pattern: "\\b(?:string|decimal|utcDateTime|int32|int64|boolean|float)\\b",
    className: "text-accent",
  },
];

const YAML_RULES: HighlightRule[] = [
  { pattern: '"[^"\\n]*"', className: "text-amber" },
  { pattern: "[\\w.$-]+(?=\\s*:)", className: "text-accent" },
  { pattern: "\\b\\d+(?:\\.\\d+)*\\b", className: "text-amber" },
];

export const highlightTypeSpec = (code: string): string =>
  highlight(code, TYPESPEC_RULES);

export const highlightYaml = (code: string): string =>
  highlight(code, YAML_RULES);
