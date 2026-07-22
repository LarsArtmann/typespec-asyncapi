
/**
 * Real-World Example Files Validation
 *
 * Compiles every .tsp file under examples/real-world/ and validates the
 * generated output against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * This test guards against regressions in real-world scenarios that exercise
 * the full emitter pipeline: complex nested models, arrays of named models,
 * protocol bindings, security schemes, multi-protocol setups, etc.
 */

import Ajv from "ajv";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";

const asyncApiSchema = JSON.parse(
  readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "node_modules",
      "@asyncapi",
      "specs",
      "schemas",
      "3.1.0-without-$id.json",
    ),
    "utf8",
  ),
);

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
const validate = ajv.compile(asyncApiSchema);

const realWorldDir = join(import.meta.dirname, "..", "..", "examples", "real-world");

function readExampleSpecs(): { name: string; source: string }[] {
  const files = readdirSync(realWorldDir)
    .filter((f) => f.endsWith(".tsp"))
    .map((f) => ({
      name: f.replace(/\.tsp$/, ""),
      path: join(realWorldDir, f),
    }))
    .filter((f) => statSync(f.path).isFile());

  return files.map((f) => ({
    name: f.name,
    source: readFileSync(f.path, "utf8"),
  }));
}

const specs = readExampleSpecs();

describe("real-World Examples → AsyncAPI 3.1 Validation", () => {
  if (specs.length === 0) {
    it("should find at least one real-world example", () => {
      expect(specs.length).toBeGreaterThan(0);
    });
    return;
  }

  for (const spec of specs) {
    describe(`example: ${spec.name}`, () => {
      it("should compile without error diagnostics", async () => {
        const result = await compileAsyncAPI(spec.source);
        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toStrictEqual([]);
      });

      it("should produce an AsyncAPI document", async () => {
        const result = await compileAsyncAPI(spec.source);
        expect(result.asyncApiDoc).toBe(true);
        expect((result.asyncApiDoc as Record<string, unknown>)?.asyncapi).toBe("3.1.0");
      });

      it("should validate against AsyncAPI 3.1.0 JSON Schema", async () => {
        const result = await compileAsyncAPI(spec.source);
        const doc = result.asyncApiDoc;

        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toStrictEqual([]);

        expect(doc).toBe(true);
        const valid = validate(doc);
        if (!valid) {
          console.error(
            `${spec.name} validation errors:`,
            JSON.stringify(validate.errors, null, 2),
          );
        }
        expect(valid).toBeTruthy();
      });

      it("should generate operations with valid $ref chains", async () => {
        const result = await compileAsyncAPI(spec.source);
        const doc = result.asyncApiDoc as Record<string, any>;

        const operations = doc.operations ?? {};
        const opCount = Object.keys(operations).length;
        expect(opCount).toBeGreaterThan(0);

        for (const [opName, op] of Object.entries(operations)) {
          const opObj = op as Record<string, any>;
          expect(opObj.action).toMatch(/^(send|receive)$/);

          const { channel } = opObj;
          expect(channel?.$ref).toMatch(/^#\/channels\//);

          for (const msg of opObj.messages ?? []) {
            expect(msg?.$ref).toMatch(/^#\/channels\//);
          }
        }
      });

      it("should generate channels with message $refs to components", async () => {
        const result = await compileAsyncAPI(spec.source);
        const doc = result.asyncApiDoc as Record<string, any>;

        const channels = doc.channels ?? {};
        expect(Object.keys(channels).length).toBeGreaterThan(0);

        for (const [, ch] of Object.entries(channels)) {
          const chObj = ch as Record<string, any>;
          expect(chObj.address).toBe(true);
          expect(chObj.address).toBeTypeOf("string");

          const messages = chObj.messages ?? {};
          for (const [, msgRef] of Object.entries(messages)) {
            expect((msgRef as any)?.$ref).toMatch(/^#\/components\/messages\//);
          }
        }
      });

      it("should generate schemas with correct array $refs for named models", async () => {
        const result = await compileAsyncAPI(spec.source);
        const doc = result.asyncApiDoc as Record<string, any>;

        const schemas = doc.components?.schemas ?? {};

        for (const [, schema] of Object.entries(schemas)) {
          const schemaObj = schema as Record<string, any>;
          if (schemaObj.type === "array" && schemaObj.items?.$ref) {
            expect(schemaObj.items.$ref).toMatch(/^#\/components\/schemas\//);
          }
          const props = schemaObj.properties ?? {};
          for (const [, prop] of Object.entries(props)) {
            const propObj = prop as Record<string, any>;
            if (propObj.type === "array" && propObj.items?.$ref) {
              expect(propObj.items.$ref).toMatch(/^#\/components\/schemas\//);
            }
          }
        }
      });
    });
  }
});
