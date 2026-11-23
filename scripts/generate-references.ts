/**
 * Generated-reference generator: derives the reference documentation from
 * source so hand-written reference docs can never drift.
 *
 * Parsed sources:
 *   - lib/main.tsp                                                -> decorators
 *   - src/lib.ts                                                  -> diagnostics
 *   - src/infrastructure/configuration/asyncAPIEmitterOptions.ts  -> emitter options
 *
 * Rendered pages (overwritten every run, deterministic order):
 *   - website/src/content/docs/reference/decorators.md
 *   - website/src/content/docs/reference/diagnostics.md
 *   - website/src/content/docs/reference/emitter-options.md
 *
 *   pnpm run references:generate   rewrite the pages
 *   pnpm run references:check      fail (exit 1) if any page on disk drifted
 *
 * Never hand-edit the generated pages; edit the sources (or this script) and
 * regenerate. Run it with bun like the other scripts in this directory.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.join(import.meta.dirname, "..");

const MAIN_TSP = path.join(repoRoot, "lib", "main.tsp");
const LIB_TS = path.join(repoRoot, "src", "lib.ts");
const EMITTER_OPTIONS_TS = path.join(
  repoRoot,
  "src",
  "infrastructure",
  "configuration",
  "asyncAPIEmitterOptions.ts",
);

export interface DecoratorParameter {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean;
}

export interface DecoratorDoc {
  readonly name: string;
  readonly targets: readonly string[];
  readonly parameters: readonly DecoratorParameter[];
  readonly summary: string;
}

export type DiagnosticSeverity = "error" | "warning";

export interface DiagnosticDoc {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
}

export interface OptionDoc {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

interface GeneratedPage {
  readonly file: string;
  readonly title: string;
  readonly content: string;
}

function readSource(file: string): string {
  return readFileSync(file, "utf8");
}

function collapseWhitespace(text: string): string {
  return text.replaceAll(/\s+/gu, " ").trim();
}

function docCommentText(rawComment: string): string {
  return collapseWhitespace(
    rawComment
      .split("\n")
      .map((line) => line.replace(/^[\s]*\*[ ]?/u, "").trim())
      .filter((line) => line.length > 0)
      .join(" "),
  );
}

function firstSentence(text: string): string {
  const cut = text.indexOf("@param");
  const description = collapseWhitespace(cut === -1 ? text : text.slice(0, cut));
  const match = /\.\s/u.exec(description);
  const end = match?.index;
  return end === undefined ? description : description.slice(0, end + 1);
}

function splitTopLevel(text: string, separator: string): readonly string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  for (const char of text) {
    if ("([{<".includes(char)) {
      depth += 1;
    } else if (")]}>".includes(char)) {
      depth -= 1;
    }
    if (char === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  const tail = current.trim();
  if (tail.length > 0) {
    parts.push(tail);
  }
  return parts.filter((part) => part.length > 0);
}

const DECORATOR_PATTERN =
  /\/\*\*(?<comment>[\s\S]*?)\*\/\s*extern\s+dec\s+(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*\((?<params>[\s\S]*?)\)\s*;/gu;

const PARAMETER_PATTERN =
  /^(?<name>[A-Za-z_][A-Za-z0-9_]*)(?<optional>\?)?:\s*(?<type>[\s\S]+)$/u;

function parseParameter(raw: string): DecoratorParameter {
  const match = PARAMETER_PATTERN.exec(raw.trim());
  const name = match?.groups?.name;
  const type = match?.groups?.type;
  if (name === undefined || type === undefined) {
    throw new Error(`cannot parse decorator parameter: ${raw}`);
  }
  return {
    name,
    type: collapseWhitespace(type),
    optional: match?.groups?.optional !== undefined,
  };
}

export function parseDecorators(source: string): readonly DecoratorDoc[] {
  const decorators: DecoratorDoc[] = [];
  for (const match of source.matchAll(DECORATOR_PATTERN)) {
    const comment = match.groups?.comment;
    const name = match.groups?.name;
    const rawParams = match.groups?.params;
    if (comment === undefined || name === undefined || rawParams === undefined) {
      throw new Error(`cannot parse decorator declaration near: ${match[0]}`);
    }
    const params = splitTopLevel(rawParams, ",").map((raw) => parseParameter(raw));
    const targets = params
      .filter((param) => param.name === "target")
      .flatMap((param) => splitTopLevel(param.type, "|"))
      .map((member) => collapseWhitespace(member));
    decorators.push({
      name,
      targets,
      parameters: params.filter((param) => param.name !== "target"),
      summary: firstSentence(docCommentText(comment)),
    });
  }
  return decorators;
}

const DIAGNOSTIC_PATTERN =
  /"(?<code>[A-Za-z][A-Za-z0-9-]*)":\s*\{\s*messages:\s*\{(?<block>[\s\S]*?)\},\s*severity:\s*"(?<severity>error|warning)"/gu;

const DEFAULT_MESSAGE_PATTERN =
  /default:\s*(?:paramMessage`(?<template>[^`]*)`|"(?<plain>(?:[^"\\]|\\.)*)")/u;

export function parseDiagnostics(source: string): readonly DiagnosticDoc[] {
  const diagnostics: DiagnosticDoc[] = [];
  for (const match of source.matchAll(DIAGNOSTIC_PATTERN)) {
    const code = match.groups?.code;
    const block = match.groups?.block;
    const severity = match.groups?.severity;
    if (
      code === undefined ||
      block === undefined ||
      (severity !== "error" && severity !== "warning")
    ) {
      throw new Error(`cannot parse diagnostic entry near: ${match[0]}`);
    }
    const message = DEFAULT_MESSAGE_PATTERN.exec(block);
    const template = message?.groups?.template;
    const plain = message?.groups?.plain;
    if (template === undefined && plain === undefined) {
      throw new Error(`cannot parse default message for diagnostic: ${code}`);
    }
    const raw = template ?? plain ?? "";
    diagnostics.push({
      code,
      severity,
      message: raw.replaceAll(/\$\{"(?<param>[^"]+)"\}/gu, "{$<param>}"),
    });
  }
  return diagnostics;
}

const OPTIONS_INTERFACE_PATTERN =
  /export\s+interface\s+EmitterOptions\b[^{]*\{(?<body>[\s\S]*?)\n\}/u;

const OPTION_FIELD_PATTERN =
  /(?:"(?<quoted>[\w-]+)"|(?<identifier>[A-Za-z_][A-Za-z0-9_]*))(?<optional>\?)?:\s*(?<type>[\s\S]*?);[ \t]*(?=\n|$)/gu;

const DOC_COMMENT_PATTERN = /\*\*(?<text>[\s\S]*?)\*\//gu;

function descriptionBefore(body: string, fieldStart: number): string {
  let description = "";
  for (const match of body.matchAll(DOC_COMMENT_PATTERN)) {
    const end = (match.index ?? 0) + match[0].length;
    if (end > fieldStart) {
      break;
    }
    if (collapseWhitespace(body.slice(end, fieldStart)).length === 0) {
      const text = match.groups?.text;
      if (text !== undefined) {
        description = docCommentText(text);
      }
    }
  }
  return description;
}

export function parseOptions(source: string): readonly OptionDoc[] {
  const interfaceMatch = OPTIONS_INTERFACE_PATTERN.exec(source);
  const body = interfaceMatch?.groups?.body;
  if (body === undefined) {
    throw new Error("cannot find the EmitterOptions interface");
  }
  const options: OptionDoc[] = [];
  for (const match of body.matchAll(OPTION_FIELD_PATTERN)) {
    const quoted = match.groups?.quoted;
    const identifier = match.groups?.identifier;
    const rawType = match.groups?.type;
    if ((quoted === undefined && identifier === undefined) || rawType === undefined) {
      throw new Error(`cannot parse emitter option near: ${match[0]}`);
    }
    options.push({
      name: quoted ?? identifier ?? "",
      type: collapseWhitespace(rawType) + (match.groups?.optional ?? ""),
      description: descriptionBefore(body, match.index ?? 0),
    });
  }
  return options;
}

function escapeCell(text: string): string {
  return collapseWhitespace(text).replaceAll("|", String.raw`\|`);
}

function compareByName(
  a: { readonly name: string },
  b: { readonly name: string },
): number {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

function compareByCode(
  a: { readonly code: string },
  b: { readonly code: string },
): number {
  if (a.code < b.code) {
    return -1;
  }
  if (a.code > b.code) {
    return 1;
  }
  return 0;
}

const GENERATED_DESCRIPTION =
  "Generated from source on every run of scripts/generate-references.ts — never hand-edit.";

const GENERATED_BANNER =
  "> **Generated file** — produced by `scripts/generate-references.ts` (`pnpm run references:generate`). Never hand-edit; the drift test fails if this file is stale.";

function renderTable(
  header: readonly string[],
  bodyRows: readonly (readonly string[])[],
): string[] {
  const grid = [header, ...bodyRows];
  const widths = header.map((_cell, column) =>
    Math.max(...grid.map((row) => row[column]?.length ?? 0)),
  );
  const lines = [
    `| ${header.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(" | ")} |`,
    `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`,
  ];
  for (const row of bodyRows) {
    lines.push(
      `| ${row.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(" | ")} |`,
    );
  }
  return lines;
}

function renderPage(
  file: string,
  title: string,
  table: readonly string[],
): GeneratedPage {
  const content = [
    "---",
    `title: ${title}`,
    `description: ${GENERATED_DESCRIPTION}`,
    "---",
    "",
    GENERATED_BANNER,
    "",
    `## ${title}`,
    "",
    ...table,
    "",
  ].join("\n");
  return { file, title, content };
}

function renderDecoratorsPage(decorators: readonly DecoratorDoc[]): GeneratedPage {
  const rows: string[][] = [];
  for (const decorator of decorators.toSorted(compareByName)) {
    const targets =
      decorator.targets.length > 0
        ? decorator.targets.map((target) => `\`${target}\``).join(", ")
        : "—";
    const parameters =
      decorator.parameters.length > 0
        ? decorator.parameters
            .map(
              (param) =>
                escapeCell(`\`${param.name}${param.optional ? "?" : ""}: ${param.type}\``),
            )
            .join(", ")
        : "—";
    rows.push([
      `\`@${decorator.name}\``,
      targets,
      parameters,
      escapeCell(decorator.summary),
    ]);
  }
  return renderPage(
    "decorators.md",
    "Decorators",
    renderTable(["Decorator", "Targets", "Parameters", "Summary"], rows),
  );
}

function renderDiagnosticsPage(diagnostics: readonly DiagnosticDoc[]): GeneratedPage {
  const rows = diagnostics
    .toSorted(compareByCode)
    .map((diagnostic) => [
      `\`${diagnostic.code}\``,
      diagnostic.severity,
      escapeCell(diagnostic.message),
    ]);
  return renderPage(
    "diagnostics.md",
    "Diagnostics",
    renderTable(["Code", "Severity", "Message"], rows),
  );
}

const IDENTIFIER_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;

function renderOptionsPage(options: readonly OptionDoc[]): GeneratedPage {
  const rows = options.toSorted(compareByName).map((option) => {
    const name = IDENTIFIER_NAME_PATTERN.test(option.name)
      ? option.name
      : `"${option.name}"`;
    return [`\`${name}\``, escapeCell(option.type), escapeCell(option.description)];
  });
  return renderPage(
    "emitter-options.md",
    "Emitter options",
    renderTable(["Option", "Type", "Description"], rows),
  );
}

function buildPages(
  decorators: readonly DecoratorDoc[],
  diagnostics: readonly DiagnosticDoc[],
  options: readonly OptionDoc[],
): readonly GeneratedPage[] {
  return [
    renderDecoratorsPage(decorators),
    renderDiagnosticsPage(diagnostics),
    renderOptionsPage(options),
  ];
}

function main(): void {
  const checkOnly = process.argv.includes("--check");
  const pages = buildPages(
    parseDecorators(readSource(MAIN_TSP)),
    parseDiagnostics(readSource(LIB_TS)),
    parseOptions(readSource(EMITTER_OPTIONS_TS)),
  );
  const drifted: string[] = [];
  for (const page of pages) {
    const relativePath = path.join("website", "src", "content", "docs", "reference", page.file);
    const absolutePath = path.join(repoRoot, relativePath);
    const current = existsSync(absolutePath)
      ? readFileSync(absolutePath, "utf8")
      : undefined;
    if (current === page.content) {
      continue;
    }
    if (checkOnly) {
      drifted.push(
        current === undefined ? `${relativePath} (missing)` : `${relativePath} (differs)`,
      );
      continue;
    }
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, page.content, "utf8");
    console.log(`wrote ${relativePath}`);
  }
  if (checkOnly) {
    if (drifted.length > 0) {
      console.error("Generated reference pages are out of date:");
      for (const entry of drifted) {
        console.error(`  - ${entry}`);
      }
      console.error("Run `pnpm run references:generate` and commit the result.");
      process.exit(1);
    }
    console.log(`generated reference pages up to date (${pages.length} files)`);
    return;
  }
  console.log(`generated ${pages.length} reference pages from source`);
}

if (import.meta.main) {
  main();
}
