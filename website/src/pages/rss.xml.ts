import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "../data/config";

export const prerender = true;

const changelog = await readFile(
  join(process.cwd(), "..", "CHANGELOG.md"),
  "utf-8",
);

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

interface Release {
  version: string;
  date?: string;
  body: string;
}

const releases: Release[] = [];
const heading = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?$/gmu;
let match: RegExpExecArray | null;
let previous: { version: string; date?: string; start: number } | undefined;

while ((match = heading.exec(changelog)) !== null) {
  if (previous) {
    releases.push({
      version: previous.version,
      date: previous.date,
      body: changelog.slice(previous.start, match.index).trim(),
    });
  }
  previous = { version: match[1], date: match[2], start: heading.lastIndex };
}

if (previous) {
  releases.push({
    version: previous.version,
    date: previous.date,
    body: changelog.slice(previous.start).trim(),
  });
}

const items = releases
  .filter((release) => release.version !== "Unreleased")
  .map((release) => {
    const anchor = `${release.version.replaceAll(".", "")}---${release.date ?? ""}`;
    const link = `${siteConfig.github}/blob/master/CHANGELOG.md#${anchor}`;
    return [
      "    <item>",
      `      <title>${escapeXml(`typespec-asyncapi ${release.version}`)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="false">${escapeXml(`${siteConfig.name}@${release.version}`)}</guid>`,
      release.date
        ? `      <pubDate>${new Date(`${release.date}T00:00:00Z`).toUTCString()}</pubDate>`
        : "",
      `      <description>${escapeXml(release.body.slice(0, 1000))}</description>`,
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  "  <channel>",
  `    <title>${escapeXml(`${siteConfig.name} releases`)}</title>`,
  `    <link>${siteConfig.siteUrl}/changelog/</link>`,
  `    <description>${escapeXml(`Release notes for ${siteConfig.name}`)}</description>`,
  "    <language>en</language>",
  `    <atom:link href="${siteConfig.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
  ...items,
  "  </channel>",
  "</rss>",
];

export function GET() {
  return new Response(`${feed.join("\n")}\n`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
