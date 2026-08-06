/**
 * Golden File: livesession/xyd production output
 *
 * Source: https://github.com/livesession/xyd (724-line production codebase)
 *
 * This test locks the verified-correct AsyncAPI output for the livesession/xyd
 * models as a regression guard. The golden file was generated from the emitter
 * output and contains 40+ schemas from the production codebase.
 *
 * If the output changes intentionally, regenerate the golden file:
 *   pnpm vitest run test/realworld/generate-golden.test.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../../utils/test-helpers.js";

const reposDir = join(import.meta.dirname, "..", "repos");
const goldenDir = join(import.meta.dirname);

const source = readFileSync(
  join(reposDir, "livesession-xyd.tsp"),
  "utf8",
);
const golden = JSON.parse(
  readFileSync(join(goldenDir, "livesession-xyd.json"), "utf8"),
) as Record<string, unknown>;

describe("golden: livesession/xyd output", () => {
  it("matches the golden file exactly", async () => {
    const result = await compileAsyncAPI(source);
    expect(result.asyncApiDoc).toStrictEqual(golden);
  });

  it("has zero compilation errors", async () => {
    const result = await compileAsyncAPI(source);
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    expect(errors).toStrictEqual([]);
  });

  it("contains 40+ schemas", async () => {
    const result = await compileAsyncAPI(source);
    const schemaCount = Object.keys(
      result.asyncApiDoc?.components?.schemas ?? {},
    ).length;
    expect(schemaCount).toBeGreaterThanOrEqual(40);
  });
});
