#!/usr/bin/env node
/**
 * axe-core accessibility audit over every built HTML page.
 *
 * Loads each built page under website/dist into jsdom, injects axe-core as a
 * real script element, and runs the wcag2a/wcag2aa/wcag21a/wcag21aa rules.
 * Prints a per-page violation report; exit 1 when violations exist
 * (CI-friendly); `--report-only` always exits 0.
 *
 * Usage: node website/scripts/axe-audit.mjs [--report-only] [--out <file>]
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const args = process.argv.slice(2);
const reportOnly = args.includes("--report-only");
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : undefined;

const DIST = new URL("../dist/", import.meta.url).pathname;

function listHtml(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      entries.push(...listHtml(full));
    } else if (name.endsWith(".html")) {
      entries.push(full);
    }
  }
  return entries;
}

async function auditPage(page, rel) {
  const dom = new JSDOM(readFileSync(page, "utf8"), {
    url: `https://typespec-asyncapi.lars.software/${rel}`,
    runScripts: "dangerously",
  });
  const { window } = dom;
  const script = window.document.createElement("script");
  script.textContent = axeSource;
  window.document.body.append(script);
  const results = await window.axe.run(window.document, {
    runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    resultTypes: ["violations"],
  });
  window.close();
  return results.violations;
}

const pages = listHtml(DIST);
const report = [];
let violationCount = 0;

for (const page of pages) {
  const rel = page.slice(DIST.length);
  for (const v of await auditPage(page, rel)) {
    violationCount += v.nodes.length;
    report.push({
      page: rel,
      rule: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 160)),
      totalNodes: v.nodes.length,
    });
  }
}

const lines = report.map(
  (r) =>
    `[${r.impact ?? "?"}] ${r.page} ${r.rule} (${r.totalNodes} node(s)): ${r.help}\n    ${r.nodes.join("\n    ")}`,
);
const summary = `axe-audit: ${pages.length} page(s), ${report.length} rule violation(s), ${violationCount} node(s)`;
console.log(summary);
if (lines.length > 0) console.log(lines.join("\n"));
if (outPath) writeFileSync(outPath, `${summary}\n${lines.join("\n")}\n`);
process.exit(lines.length > 0 && !reportOnly ? 1 : 0);
