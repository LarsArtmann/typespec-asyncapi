import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

const DIST = "dist";

/**
 * Per the CSP specification, when a `style-src` (or `default-src`) source list
 * contains ANY hash or nonce source, the `'unsafe-inline'` keyword is IGNORED
 * entirely. Starlight and Expressive Code rely on inline `style` attributes
 * (e.g. expressive-code tokens: `style="--0:#color;--1:#color"`), so we must
 * strip every hash/nonce source from the style-src directive to keep
 * `'unsafe-inline'` effective. Astro regenerates these hashes on every build,
 * in any order, so we strip them defensively regardless of position/type.
 */
const STYLE_HASH_TOKEN_RE = /'sha\d{3}-[^']+'|'nonce-[^']+'/g;

function stripStyleHashes(cspContent) {
  return cspContent.replace(/style-src[^;"]*/g, (directive) => {
    const sources = directive
      .slice("style-src".length)
      .replace(STYLE_HASH_TOKEN_RE, "")
      .trim()
      .replace(/\s{2,}/g, " ");
    return `style-src ${sources}`.trim();
  });
}

const EMPTY_STRING_HASH = "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='";

function stripEmptyScriptHash(cspContent) {
  return cspContent.replaceAll(` ${EMPTY_STRING_HASH}`, "");
}

const INLINE_SCRIPT_RE =
  /<script(?![^>]*\btype\s*=\s*["']module["'])(?![^>]*\bsrc\s*=)([^>]*)>([\s\S]*?)<\/script>/g;

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
  return "sha256-" + createHash("sha256").update(content, "utf-8").digest("base64");
}

async function main() {
  const files = await findHtmlFiles(DIST);
  let patched = 0;

  for (const file of files) {
    const html = await readFile(file, "utf-8");
    let fixed = stripStyleHashes(html);
    fixed = stripEmptyScriptHash(fixed);

    const missingHashes = new Set();
    for (const [, , body] of fixed.matchAll(INLINE_SCRIPT_RE)) {
      const trimmed = body.trim();
      if (!trimmed) continue;
      const hash = sha256Base64(trimmed);
      missingHashes.add(`'${hash}'`);
    }

    if (missingHashes.size > 0) {
      const hashList = [...missingHashes].join(" ");
      fixed = fixed.replace(/script-src ('self'(?: 'sha256-[^']+')*)/, `script-src $1 ${hashList}`);
    }

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
