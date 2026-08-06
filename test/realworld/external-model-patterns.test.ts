/**
 * Real-World External Model Patterns — Compilation & Validation
 *
 * Compiles TypeSpec fixtures that faithfully recreate MODEL PATTERNS from real
 * sibling projects (Kernovia, typespec-eventsourcing, blog/content-spec,
 * accountability-system, superb-gh-milestone-extention) through the AsyncAPI
 * emitter and validates output against the official AsyncAPI 3.1.0 JSON Schema.
 *
 * Unlike the project's own examples (written by the emitter author, sharing
 * blind spots), these fixtures exercise patterns written by DIFFERENT authors
 * for DIFFERENT domains — exposing failure modes the emitter's own tests miss.
 *
 * Pattern coverage:
 *   kernovia-branded-types:   Multi-level scalar inheritance, branded IDs,
 *                            kebab-case enum values, default values, Record<unknown>,
 *                            array-of-union-literals, nested inline objects
 *   eventsourcing-generics:   Generic models, spread of generic with literal arg,
 *                            phantom brand fields, named unions (discriminated),
 *                            3-level event hierarchy with property narrowing
 *   blog-campaign-nesting:    Deeply nested anonymous objects (4-5 levels),
 *                            arrays of inline objects, many string literal unions
 *   accountability-domain:    Enums with/without string values, @format decorator,
 *                            @pattern regex validation, @minLength/@maxLength/@maxItems
 *   milestone-analysis:       Scalar extending uint8, @format uuid/uri, uint types,
 *                            numeric validation decorators, cross-model references
 *   ecommerce-complete:       Full e-commerce domain, 20+ cross-referenced models,
 *                            decimal types, complex status enums, multiple domains
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { compileAndValidate } from "../utils/schema-validator.js";

const fixturesDir = join(import.meta.dirname, "fixtures");

interface Fixture {
  name: string;
  source: string;
}

function loadFixtures(): Fixture[] {
  return readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".tsp"))
    .map((f) => ({
      name: f.replace(/\.tsp$/, ""),
      source: readFileSync(join(fixturesDir, f), "utf8"),
    }))
    .filter((f) => statSync(join(fixturesDir, `${f.name}.tsp`)).isFile());
}

const fixtures = loadFixtures();

describe("real-World External Model Patterns", () => {
  it("should have at least 5 real-world fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(5);
  });

  for (const fixture of fixtures) {
    describe(`fixture: ${fixture.name}`, () => {
      it("should compile without error diagnostics", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const errors = result.diagnostics.filter((d) => d.severity === "error");
        expect(errors).toStrictEqual([]);
      });

      it("should produce an AsyncAPI 3.1.0 document", async () => {
        const result = await compileAsyncAPI(fixture.source);
        expect(result.asyncApiDoc).toBeDefined();
        expect(result.asyncApiDoc?.asyncapi).toBe("3.1.0");
      });

      it("should validate against the official AsyncAPI 3.1.0 JSON Schema", async () => {
        const validation = await compileAndValidate(fixture.source);
        const schemaErrors = validation.errors
          ? validation.errors.map((e) => `${e.instancePath}: ${e.message}`)
          : [];
        const diagErrors = validation.diagnostics
          .filter((d) => d.severity === "error")
          .map((d) => `[${d.code}] ${d.message}`);
        expect({
          valid: validation.valid,
          schemaErrors,
          diagErrors,
        }).toStrictEqual({
          valid: true,
          schemaErrors: [],
          diagErrors: [],
        });
      });

      it("should have at least 2 operations", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const ops = result.asyncApiDoc?.operations ?? {};
        expect(Object.keys(ops).length).toBeGreaterThanOrEqual(2);
      });

      it("should have at least 2 channels", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const channels = result.asyncApiDoc?.channels ?? {};
        expect(Object.keys(channels).length).toBeGreaterThanOrEqual(2);
      });

      it("should have at least 3 schemas in components", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const schemas = result.asyncApiDoc?.components?.schemas ?? {};
        expect(Object.keys(schemas).length).toBeGreaterThanOrEqual(3);
      });

      it("should produce valid $ref chains (operations to channels to components)", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const doc = result.asyncApiDoc;
        expect(doc).toBeDefined();

        const opRefs: string[] = [];
        for (const [, op] of Object.entries(doc?.operations ?? {})) {
          opRefs.push(op.channel?.$ref ?? "");
          for (const msg of op.messages ?? []) {
            opRefs.push(msg.$ref ?? "");
          }
        }
        for (const ref of opRefs) {
          expect(ref).toMatch(/^#\/channels\//);
        }

        const channelMsgRefs: string[] = [];
        for (const [, ch] of Object.entries(doc?.channels ?? {})) {
          for (const [, msgRef] of Object.entries(ch.messages ?? {})) {
            channelMsgRefs.push(msgRef.$ref ?? "");
          }
        }
        for (const ref of channelMsgRefs) {
          expect(ref).toMatch(/^#\/components\/messages\//);
        }
      });

      it("should produce valid $ref for named model arrays", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const schemas = result.asyncApiDoc?.components?.schemas ?? {};
        const allItemRefs: string[] = [];
        for (const [, schema] of Object.entries(schemas)) {
          for (const [, prop] of Object.entries(schema.properties ?? {})) {
            const ref = prop.items?.$ref;
            if (typeof ref === "string") {
              allItemRefs.push(ref);
            }
          }
        }
        for (const ref of allItemRefs) {
          expect(ref).toMatch(/^#\/components\/schemas\//);
        }
      });

      it("should produce messages with valid contentType", async () => {
        const result = await compileAsyncAPI(fixture.source);
        const messages = result.asyncApiDoc?.components?.messages ?? {};
        expect(Object.keys(messages).length).toBeGreaterThan(0);
        for (const [, msg] of Object.entries(messages)) {
          expect(msg.contentType).toBeTypeOf("string");
        }
      });
    });
  }
});
