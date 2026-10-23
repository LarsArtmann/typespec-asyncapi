import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const DIST = "dist";

/**
 * Astro hashes the scripts it generates, but raw inline `<script>` blocks that a
 * component injects into the final HTML can survive unhashed, and CSP then blocks
 * them. This pass adds a sha256 hash for every inline script that the page's
 * `script-src` policy does not already permit. It is idempotent: hashes that are
 * already present are not duplicated, and a second run changes nothing.
 *
 * Style directives are NOT touched. `style-src-attr 'unsafe-inline'` covers the
 * inline `style` attributes written by Expressive Code/Shiki, and `style-src`
 * keeps Astro's element hashes so inline `<style>` blocks stay hash-controlled.
 */
const EMPTY_STRING_HASH =
  "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";

const INLINE_SCRIPT_RE =
  /<script(?![^>]*\btype\s*=\s*["']module["'])(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/g;

const CSP_META_RE =
  /(<meta[^>]*content-security-policy[^>]*content=")([^"]*)(")/i;

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

function addScriptHashes(policy, hashes) {
  if (hashes.length === 0) return policy;
  const known = new Set(policy.match(/'sha(?:256|384|512)-[^']+'/g) ?? []);
  const missing = hashes.filter((hash) => !known.has(hash));
  if (missing.length === 0) return policy;

  return policy.replace(
    /(^|;\s*)(script-src(?!-)[^;]*)/,
    (_match, lead, directive) => `${lead}${[directive, ...missing].join(" ")}`,
  );
}

async function main() {
  const files = await findHtmlFiles(DIST);
  let patched = 0;

  for (const file of files) {
    const html = await readFile(file, "utf-8");
    const match = html.match(CSP_META_RE);
    if (!match) continue;

    const hashes = new Set();
    for (const [, , body] of html.matchAll(INLINE_SCRIPT_RE)) {
      const trimmed = body.trim();
      if (trimmed) hashes.add(`'${sha256Base64(trimmed)}'`);
    }

    const policy = addScriptHashes(match[2], [...hashes]).replaceAll(
      ` ${EMPTY_STRING_HASH}`,
      "",
    );

    if (policy === match[2]) continue;

    const fixed = html.replace(
      CSP_META_RE,
      (_m, prefix, _old, suffix) => `${prefix}${policy}${suffix}`,
    );
    if (fixed !== html) {
      await writeFile(file, fixed);
      patched++;
    }
  }

  console.log(`CSP fix: patched ${patched}/${files.length} HTML files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
