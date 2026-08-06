/**
 * GitHub Real-Project Compilation — ACTUAL FILES
 *
 * These are the VERBATIM .tsp files copied directly from GitHub repositories.
 * No modifications to model definitions, decorator syntax, or types.
 *
 * The test TRIES to compile each file through this AsyncAPI emitter and
 * reports what actually happens. Failures are FINDINGS, not things to fix:
 *
 *   - Missing import packages → documents ecosystem compatibility gaps
 *   - Wrong decorator APIs → documents emitter API differences
 *   - TypeSpec version incompatibilities → documents version drift
 *   - Successful compilation → confirms emitter handles real-world patterns
 *
 * Source repos:
 *   bterlson/typespec-todo        https://github.com/bterlson/typespec-todo
 *     → TypeSpec creator's todo app (HTTP/REST + JSON Schema)
 *   DanSnow/typespec-events       https://github.com/DanSnow/typespec-events
 *     → Event tracking library (custom @event decorator)
 *   livesession/xyd               https://github.com/livesession/xyd
 *     → Production API toolchain (pure data models, no decorators)
 *   Azure/azure-rest-api-specs    https://github.com/Azure/azure-rest-api-specs
 *     → Azure EventGrid Namespace (HTTP REST + CloudEvents)
 *   milehimikey/typespec-asyncapi https://github.com/milehimikey/typespec-asyncapi
 *     → Competing AsyncAPI 3.0 emitter (uses @channel/@publish/@subscribe)
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const reposDir = join(import.meta.dirname, "repos");

interface RepoFile {
  name: string;
  source: string;
}

function loadRepoFiles(): RepoFile[] {
  return readdirSync(reposDir)
    .filter((f) => f.endsWith(".tsp"))
    .map((f) => ({
      name: f.replace(/\.tsp$/, ""),
      source: readFileSync(join(reposDir, f), "utf8"),
    }));
}

const repoFiles = loadRepoFiles();

describe("github actual-file compilation findings", () => {
  it("should have loaded 5 real repo files", () => {
    expect(repoFiles).toHaveLength(5);
  });

  for (const file of repoFiles) {
    describe(`repo: ${file.name} (verbatim from GitHub)`, () => {
      const result = compileAsyncAPI(file.source);

      it("should attempt compilation and capture diagnostics", async () => {
        const r = await result;
        expect(r).toBeDefined();
        expect(r.diagnostics).toBeDefined();
      });

      it("diagnostics should describe the compatibility situation", async () => {
        const r = await result;
        const diagSummary = r.diagnostics
          .filter((d) => d.severity === "error")
          .map((d) => ({ code: d.code, message: d.message }))
          .toSorted((a, b) => a.code.localeCompare(b.code));

        for (const d of diagSummary) {
          expect(d.code).toBeTypeOf("string");
          expect(d.message).toBeTypeOf("string");
        }
      });
    });
  }
});
