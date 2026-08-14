/**
 * Regenerate golden files from current emitter output.
 *
 * Usage: bun run scripts/regenerate-golden.ts
 *
 * Run this after an INTENTIONAL output change, then review the diff of the
 * golden JSON before committing.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compileAsyncAPI } from "../test/utils/test-helpers.js";

const { join } = path;
const repoRoot = import.meta.dirname.replace(/\/scripts$/, "");
const goldenDir = join(repoRoot, "test", "realworld", "golden");

const source = readFileSync(
  join(repoRoot, "test", "realworld", "repos", "livesession-xyd.tsp"),
  "utf8",
);

async function main(): Promise<void> {
  const result = await compileAsyncAPI(source);
  if (!result.asyncApiDoc) {
    throw new Error("emitter produced no AsyncAPI document");
  }
  const target = join(goldenDir, "livesession-xyd.json");
  writeFileSync(target, `${JSON.stringify(result.asyncApiDoc, null, 2)}\n`, "utf8");
  console.log(`Regenerated ${target}`);
}

await main();
