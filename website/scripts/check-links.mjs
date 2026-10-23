import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const DIST = resolve("dist");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function isIgnored(href) {
  return (
    href === "" ||
    href.startsWith("#") ||
    href.startsWith("//") ||
    /^(?:[a-z][a-z0-9+.-]*:)/iu.test(href)
  );
}

async function resolveTarget(pageFile, href) {
  const clean = href.split("#")[0].split("?")[0];
  if (clean === "") return null;

  const base = clean.startsWith("/")
    ? join(DIST, clean)
    : resolve(dirname(pageFile), clean);

  if (clean.endsWith("/")) {
    return join(base, "index.html");
  }
  if (await exists(base)) {
    if ((await stat(base)).isDirectory()) return join(base, "index.html");
    return base;
  }
  if (await exists(`${base}.html`)) return `${base}.html`;
  if (await exists(join(base, "index.html"))) return join(base, "index.html");
  return base;
}

const htmlFiles = await walk(DIST);
const missing = [];
let checked = 0;

const attributePattern = /(?:href|src)="([^"]+)"/gu;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf-8");
  for (const match of html.matchAll(attributePattern)) {
    const href = match[1];
    if (isIgnored(href)) continue;
    const target = await resolveTarget(file, href);
    if (target === null) continue;
    checked++;
    if (!(await exists(target))) {
      missing.push({
        page: relative(DIST, file),
        href,
        target: relative(DIST, target),
      });
    }
  }
}

for (const required of [
  "index.html",
  "404.html",
  "sitemap-index.xml",
  "robots.txt",
  "llms.txt",
  "llms-full.txt",
  "llms-small.txt",
  "manifest.json",
  "opensearch.xml",
  "rss.xml",
  "favicon.svg",
  ".well-known/security.txt",
]) {
  if (!(await exists(join(DIST, required)))) {
    missing.push({ page: "<build>", href: required, target: required });
  }
}

if (missing.length > 0) {
  console.error(`Broken internal references (${missing.length}):`);
  for (const item of missing) {
    console.error(`  ${item.page}: ${item.href} -> ${item.target}`);
  }
  process.exit(1);
}

console.log(
  `links: ${checked} internal references across ${htmlFiles.length} pages are valid`,
);
