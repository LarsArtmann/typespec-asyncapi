import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const DOCS = "src/content/docs";
const BASE = "https://typespec-asyncapi.lars.software/og";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

for (const file of await walk(DOCS)) {
  const source = await readFile(file, "utf-8");
  if (!source.startsWith("---\n")) continue;
  const end = source.indexOf("\n---", 4);
  if (end === -1) continue;
  const frontmatter = source.slice(4, end);
  if (/^head:/mu.test(frontmatter)) continue;

  const id = relative(DOCS, file).replace(/\.md$/u, "");
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/mu);
  const title = titleMatch ? titleMatch[1].replace(/^["']|["']$/gu, "") : id;
  const image = `${BASE}/${id}.png`;
  const alt = `${title} — typespec-asyncapi`;

  const block = [
    "",
    "head:",
    "  - tag: meta",
    "    attrs:",
    "      property: og:image",
    `      content: ${JSON.stringify(image)}`,
    "  - tag: meta",
    "    attrs:",
    "      property: og:image:width",
    '      content: "1200"',
    "  - tag: meta",
    "    attrs:",
    "      property: og:image:height",
    '      content: "630"',
    "  - tag: meta",
    "    attrs:",
    "      property: og:image:alt",
    `      content: ${JSON.stringify(alt)}`,
    "  - tag: meta",
    "    attrs:",
    "      name: twitter:image",
    `      content: ${JSON.stringify(image)}`,
    "",
  ].join("\n");

  await writeFile(file, source.slice(0, end) + block + source.slice(end));
  console.log(`og: ${id}`);
}
