import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

/**
 * Guards the Content-Security-Policy that Astro emits into every built page.
 *
 * The policy has to stay both strict and working:
 * - scripts are allowed by hash only (never `'unsafe-inline'`),
 * - `'unsafe-inline'` is scoped to `style-src-attr`, because Expressive
 *   Code/Shiki highlight through `style` attributes and CSP cannot hash or
 *   nonce attributes,
 * - inline `<style>` blocks are hash-controlled through `style-src`.
 *
 * A malformed directive (e.g. `style-src -attr`, produced by an earlier
 * post-processing pass) silently disables that scope in the browser, so this
 * script also validates directive names and hash coverage per page.
 */
const DIST = "dist";
const HASH_RE = /'sha(?:256|384|512)-[^']+'/g;
const INLINE_STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;
const INLINE_SCRIPT_RE = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/g;
const STYLE_ATTRIBUTE_RE = /\sstyle="[^"]*"/g;
const CSP_META_RE = /content-security-policy" content="([^"]*)"/i;

const errors = [];

async function findHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findHtmlFiles(full)));
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function sha256Base64(content) {
  return (
    "sha256-" + createHash("sha256").update(content, "utf-8").digest("base64")
  );
}

function parsePolicy(policy) {
  const directives = new Map();
  for (const segment of policy.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const [name, ...sources] = trimmed.split(/\s+/);
    directives.set(name, sources);
  }
  return directives;
}

function hashesOf(sources) {
  return new Set((sources ?? []).join(" ").match(HASH_RE) ?? []);
}

function effective(directives, specific, fallback) {
  return directives.has(specific)
    ? [specific, directives.get(specific)]
    : [fallback, directives.get(fallback) ?? []];
}

function checkFile(file, html) {
  const match = html.match(CSP_META_RE);
  if (!match) {
    errors.push(`${file}: no Content-Security-Policy meta tag`);
    return;
  }

  const policy = match[1];
  const directives = parsePolicy(policy);

  for (const [name, sources] of directives) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      errors.push(`${file}: malformed directive name "${name}"`);
    }
    for (const source of sources) {
      if (source.startsWith("-")) {
        errors.push(
          `${file}: directive "${name}" has a stray source "${source}" (was a directive name split in two?)`,
        );
      }
    }
  }

  const scriptSrc = directives.get("script-src") ?? [];
  if (scriptSrc.includes("'unsafe-inline'")) {
    errors.push(`${file}: script-src must not contain 'unsafe-inline'`);
  }
  if (!scriptSrc.includes("'self'")) {
    errors.push(`${file}: script-src is missing 'self'`);
  }

  const styleSrc = directives.get("style-src") ?? [];
  if (styleSrc.includes("'unsafe-inline'")) {
    errors.push(`${file}: style-src must not contain 'unsafe-inline'`);
  }

  const usesStyleAttributes = STYLE_ATTRIBUTE_RE.test(html);
  const styleAttr = directives.get("style-src-attr");
  if (usesStyleAttributes && styleAttr === undefined) {
    errors.push(`${file}: inline style attributes are used but style-src-attr is missing`);
  }
  if (styleAttr !== undefined && !styleAttr.includes("'unsafe-inline'")) {
    errors.push(`${file}: style-src-attr must allow 'unsafe-inline'`);
  }

  const [styleDirectiveName, styleSources] = effective(
    directives,
    "style-src-elem",
    "style-src",
  );
  const styleHashes = hashesOf(styleSources);
  for (const [, body] of html.matchAll(INLINE_STYLE_RE)) {
    const content = body.trim();
    if (!content) continue;
    const hash = `'${sha256Base64(content)}'`;
    if (!styleHashes.has(hash)) {
      errors.push(
        `${file}: inline <style> block is not hashed by ${styleDirectiveName}`,
      );
    }
  }

  const [scriptDirectiveName, scriptSources] = effective(
    directives,
    "script-src-elem",
    "script-src",
  );
  const scriptHashes = hashesOf(scriptSources);
  for (const [, body] of html.matchAll(INLINE_SCRIPT_RE)) {
    const content = body.trim();
    if (!content) continue;
    const hash = `'${sha256Base64(content)}'`;
    if (!scriptHashes.has(hash)) {
      errors.push(
        `${file}: inline <script> is not hashed by ${scriptDirectiveName}`,
      );
    }
  }
}

async function main() {
  const files = await findHtmlFiles(DIST);
  for (const file of files) {
    checkFile(file, await readFile(file, "utf-8"));
  }

  if (errors.length > 0) {
    console.error(`csp: ${errors.length} problem(s) found`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(`csp: ${files.length} pages carry a valid, hash-covered policy`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
