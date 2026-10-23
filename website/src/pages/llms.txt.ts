import { getCollection } from "astro:content";
import { siteConfig } from "../data/config";

export const prerender = true;

const docs = (await getCollection("docs"))
  .filter((entry) => entry.id !== "404")
  .sort((a, b) => a.id.localeCompare(b.id));

const lines = [
  `# ${siteConfig.name}`,
  "",
  `> ${siteConfig.description}`,
  "",
  "Documentation:",
  "",
  `- [Home](${siteConfig.siteUrl}/): Overview and feature summary.`,
  ...docs.map(
    (entry) =>
      `- [${entry.data.title}](${siteConfig.siteUrl}/${entry.id}/): ${entry.data.description ?? ""}`,
  ),
  "",
  "## Project",
  "",
  `- [GitHub repository](${siteConfig.github})`,
  `- [npm package](${siteConfig.npm})`,
  `- [Changelog](${siteConfig.siteUrl}/changelog/)`,
];

export function GET() {
  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
