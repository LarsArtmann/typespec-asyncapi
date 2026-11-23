/**
 * Shared byte-check/write discipline for generated-artifact generators.
 *
 * Every generator produces deterministic files; this helper owns the
 * compare/report/write loop so `--check` semantics cannot drift between
 * generators (missing/differ reporting, regenerate hint, exit code).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export function syncGeneratedFiles(
  repoRoot: string,
  files: GeneratedFile[],
  opts: { checkOnly: boolean; label: string; regenerateHint: string },
): void {
  const drifted: string[] = [];
  for (const file of files) {
    const absolutePath = join(repoRoot, file.relativePath);
    const current = existsSync(absolutePath)
      ? readFileSync(absolutePath, "utf8")
      : undefined;
    if (current === file.content) {
      continue;
    }
    if (opts.checkOnly) {
      drifted.push(
        current === undefined
          ? `${file.relativePath} (missing)`
          : `${file.relativePath} (differs)`,
      );
      continue;
    }
    mkdirSync(join(absolutePath, ".."), { recursive: true });
    writeFileSync(absolutePath, file.content, "utf8");
    console.log(`wrote ${file.relativePath}`);
  }
  if (opts.checkOnly && drifted.length > 0) {
    console.error(`${opts.label} are out of date:`);
    for (const entry of drifted) {
      console.error(`  - ${entry}`);
    }
    console.error(`Run \`${opts.regenerateHint}\` and commit the result.`);
    process.exit(1);
  }
}
