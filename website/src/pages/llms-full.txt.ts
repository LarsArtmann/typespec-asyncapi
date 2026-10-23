import { getCollection } from "astro:content";
import { siteConfig } from "../data/config";

export const prerender = true;

const docs = (await getCollection("docs"))
  .filter((entry) => entry.id !== "404")
  .sort((a, b) => a.id.localeCompare(b.id));

const sections = docs.map((entry) => {
  const body = (entry.body ?? "").trim();
  return `# ${entry.data.title}\n\nSource: ${siteConfig.siteUrl}/${entry.id}/\n\n${body}`;
});

const header = [
  `# ${siteConfig.name} — full documentation`,
  "",
  `> ${siteConfig.description}`,
  "",
  `Canonical site: ${siteConfig.siteUrl}/`,
  `Repository: ${siteConfig.github}`,
  "",
  "---",
  "",
];

export function GET() {
  return new Response(`${[...header, ...sections].join("\n\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
