/**
 * All Example Files → AsyncAPI 3.1 Validation
 *
 * Compiles every .tsp file under examples/ (recursive) and validates
 * the generated output against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * This test ensures the emitter produces spec-compliant output for every
 * example shipped with the project, catching regressions in:
 * - Schema generation (arrays of named models, Record types, nested models)
 * - Protocol binding placement (channel vs operation vs message bindings)
 * - Security scheme formatting (OAuth2 availableScopes, etc.)
 * - $ref chain integrity (operations → channels → components)
 */

import { describe, it, expect } from "bun:test";
import Ajv from "ajv";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const asyncApiSchema = JSON.parse(
  readFileSync(
    join(
      import.meta.dir,
      "..",
      "..",
      "node_modules",
      "@asyncapi",
      "specs",
      "schemas",
      "3.1.0-without-$id.json",
    ),
    "utf-8",
  ),
);

const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
const validate = ajv.compile(asyncApiSchema);

const examplesRoot = join(import.meta.dir, "..", "..", "examples");

function findTspFiles(
  dir: string,
  acc: { name: string; path: string }[] = [],
): { name: string; path: string }[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findTspFiles(fullPath, acc);
    } else if (entry.endsWith(".tsp")) {
      const relative = fullPath.replace(examplesRoot + "/", "").replace(/\.tsp$/, "");
      acc.push({ name: relative, path: fullPath });
    }
  }
  return acc;
}

const exampleFiles = findTspFiles(examplesRoot);

describe("All Example Files → AsyncAPI 3.1 Validation", () => {
  if (exampleFiles.length === 0) {
    it("should find at least one example file", () => {
      expect(exampleFiles.length).toBeGreaterThan(0);
    });
    return;
  }

  for (const file of exampleFiles) {
    const source = readFileSync(file.path, "utf-8");

    describe(`example: ${file.name}`, () => {
      it("should compile without error diagnostics", async () => {
        const result = await compileAsyncAPI(source);
        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toEqual([]);
      });

      it("should produce an asyncapi: 3.1.0 document", async () => {
        const result = await compileAsyncAPI(source);
        expect(result.asyncApiDoc).toBeTruthy();
        expect((result.asyncApiDoc as Record<string, unknown>)?.asyncapi).toBe("3.1.0");
      });

      it("should validate against AsyncAPI 3.1.0 JSON Schema", async () => {
        const result = await compileAsyncAPI(source);
        const doc = result.asyncApiDoc;

        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toEqual([]);

        expect(doc).toBeTruthy();
        const valid = validate(doc);
        if (!valid) {
          console.error(
            `${file.name} validation errors:`,
            JSON.stringify(validate.errors, null, 2),
          );
        }
        expect(valid).toBe(true);
      });

      it("should generate valid $ref chains for operations and channels", async () => {
        const result = await compileAsyncAPI(source);
        const doc = result.asyncApiDoc as Record<string, any>;

        const channels = doc.channels ?? {};
        const operations = doc.operations ?? {};

        for (const [, op] of Object.entries(operations)) {
          const opObj = op as Record<string, any>;
          expect(opObj.channel?.$ref).toMatch(/^#\/channels\//);
          for (const msg of opObj.messages ?? []) {
            expect((msg as any)?.$ref).toMatch(/^#\/channels\//);
          }
        }

        for (const [, ch] of Object.entries(channels)) {
          const chObj = ch as Record<string, any>;
          const messages = chObj.messages ?? {};
          for (const [, ref] of Object.entries(messages)) {
            expect((ref as any)?.$ref).toMatch(/^#\/components\/messages\//);
          }
        }
      });
    });
  }
});
