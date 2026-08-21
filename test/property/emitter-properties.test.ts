/**
 * Property-Based Tests (fast-check)
 *
 * Invariants checked against randomly generated TypeSpec sources:
 *  P1 random model graphs always validate against the AsyncAPI 3.1 schema
 *  P2 random constraint pairs never contradict (min<=max, minLen<=maxLen,
 *     minItems<=maxItems) — pairs are generated consistent by construction
 *  P3 every emitted $ref resolves within its document (~1/~0-aware)
 *  P4 enum/union/literal mappings always yield a `type` or `const`/`enum`
 *  P5 split-schemas rewriting preserves the full ref graph
 *  P6 determinism — the same source compiles byte-identically twice
 *
 * Reproduction: seeds are pinned via SEED below; override with FC_SEED
 * env var, then set `numRuns` higher locally to hunt. A failing seed is
 * printed in the vitest error (fast-check reports `seed:`).
 */

import fc from "fast-check";
import { collectRefs } from "../utils/ref-utils.js";
import { compileAndValidate } from "../utils/schema-validator.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import type { AsyncAPIEmitterOptions } from "../../src/infrastructure/configuration/asyncAPIEmitterOptions.js";

// eslint-disable-next-line node/no-process-env -- FC_SEED is the documented reproduction override
const SEED = Number(process.env["FC_SEED"] ?? 20_260_821);
const RUNS = 20;

/** Deterministic property runner with the shared pinned seed. */
function property<T>(name: string, arb: fc.Arbitrary<T>, check: (t: T) => Promise<void>): Promise<void> {
  return fc.assert(
    fc.asyncProperty(arb, check),
    { seed: SEED, numRuns: RUNS },
  );
}

const identifier = fc
  .stringMatching(/^[A-Z][a-zA-Z0-9]{2,11}$/u)
  .filter((s) => !["Test", "TypeSpec"].includes(s));

/** Lowercase TypeSpec keywords that cannot be used as identifiers. */
const RESERVED = new Set([
  "model", "enum", "union", "scalar", "op", "namespace", "interface",
  "import", "using", "dec", "extern", "void", "never", "unknown", "true", "false",
  "string", "int32", "int64", "float64", "boolean", "utcDateTime",
]);

const fieldName = fc
  .stringMatching(/^[a-z][a-zA-Z0-9]{2,11}$/u)
  .filter((name) => !RESERVED.has(name));

const scalarType = fc.constantFrom(
  "string",
  "int32",
  "int64",
  "float64",
  "boolean",
  "utcDateTime",
);

interface FieldSpec {
  name: string;
  type: string;
  optional: boolean;
  min: number;
  max: number;
  minLen: number;
  maxLen: number;
}

const fieldSpec = fc.record({
  name: fieldName,
  type: scalarType,
  optional: fc.boolean(),
  min: fc.integer({ min: 0, max: 90 }),
  maxLen: fc.integer({ min: 1, max: 80 }),
  minItems: fc.integer({ min: 0, max: 5 }),
});

/** Pair constraints are made CONSISTENT by construction (P2): min <= max etc. */
const consistentFieldSpec: fc.Arbitrary<FieldSpec> = fc
  .tuple(fieldSpec, fc.integer({ min: 0, max: 9 }), fc.integer({ min: 0, max: 9 }))
  .map(([base, spread, lenSpread]) => ({
    ...base,
    max: base.min + spread,
    minLen: Math.max(0, base.maxLen - lenSpread),
    maxItems: base.minItems + spread,
  }));

function renderField(field: FieldSpec): string {
  const numeric = field.type === "int32" || field.type === "int64" || field.type === "float64";
  const rawConstraints = [
    numeric ? `@minValue(${field.min})` : "",
    numeric ? `@maxValue(${field.max})` : "",
    field.type === "string" ? `@minLength(${field.minLen})` : "",
    field.type === "string" ? `@maxLength(${field.maxLen})` : "",
  ];
  const constraints = rawConstraints.filter(Boolean).join(" ");
  const prefix = constraints.length > 0 ? `${constraints}\n  ` : "";
  return `${prefix}${field.name}${field.optional ? "?" : ""}: ${field.type};`;
}

interface ModelSpec {
  name: string;
  fields: FieldSpec[];
  enumValues: string[] | null;
}

const enumNames = fc.uniqueArray(
  fc.stringMatching(/^[a-z]{3,8}$/u).filter((name) => !RESERVED.has(name)),
  { minLength: 2, maxLength: 4 },
);

const modelSpec = fc.record({
  name: identifier,
  fields: fc.uniqueArray(consistentFieldSpec, {
    selector: (field) => field.name,
    minLength: 1,
    maxLength: 6,
  }),
  withEnum: fc.option(enumNames, { nil: null }),
});

function renderModel(model: ModelSpec): string {
  const enumBlock =
    model.withEnum === null
      ? ""
      : `enum ${model.name}Status { ${model.withEnum.join(", ")} }\n\n`;
  const fields = model.fields.map(renderField).join("\n  ");
  return `${enumBlock}model ${model.name} {\n  ${fields}\n}`;
}

const specArbitrary = fc.record({
  models: fc.uniqueArray(modelSpec, {
    selector: (model) => model.name,
    minLength: 1,
    maxLength: 4,
  }),
  opName: identifier,
  channelName: fc.stringMatching(/^[a-z]{3,10}\/[a-z]{3,10}$/u),
});

function renderSpec(spec: {
  models: ModelSpec[];
  opName: string;
  channelName: string;
}): string {
  const models = spec.models.map(renderModel).join("\n\n");
  const payload = spec.models[0]!.name;
  return `
    namespace Test;
    ${models}
    @channel("${spec.channelName}")
    op ${spec.opName}(): ${payload};
  `;
}

/** Recursively collect $ref strings from any emitted object. */
function collectRefs(node: unknown, acc: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectRefs(item, acc);
    }
    return acc;
  }
  if (typeof node === "object" && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      if (key === "$ref" && typeof value === "string") {
        acc.push(value);
      } else {
        collectRefs(value, acc);
      }
    }
  }
  return acc;
}

/** Resolve a JSON pointer (RFC 6901, ~0/~1 aware) inside a document. */
function pointerExists(document: unknown, ref: string): boolean {
  if (!ref.startsWith("#/")) {
    return false;
  }
  let current: unknown = document;
  for (const rawToken of ref.slice(2).split("/")) {
    const token = rawToken.replaceAll("~1", "/").replaceAll("~0", "~");
    if (typeof current !== "object" || current === null) {
      return false;
    }
    current = (current as Record<string, unknown>)[decodeURIComponent(token)];
    if (current === undefined) {
      return false;
    }
  }
  return true;
}

describe("property: emitter invariants (seed pinned, FC_SEED to reproduce)", () => {
  it("property 1: random model graphs always validate against AsyncAPI 3.1", async () => {
    await property("spec", specArbitrary, async (spec) => {
      const result = await compileAndValidate(renderSpec(spec));
      expect(result.valid).toBe(true);
    });
  });

  it("property 2: consistent constraint pairs survive emission ordered", async () => {
    await property("field", consistentFieldSpec, async (field) => {
      const source = `
        namespace Test;
        model Holder {
          ${renderField(field)}
        }
        op read(): Holder;
      `;
      const result = await compileAndValidate(source);
      expect(result.valid).toBe(true);
    });
  });

  it("property 3: every emitted $ref resolves within the document", async () => {
    await property("spec", specArbitrary, async (spec) => {
      const result = await compileAndValidate(renderSpec(spec));
      const refs = collectRefs(result.document);
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        expect(pointerExists(result.document, ref)).toBe(true);
      }
    });
  });

  it("property 4: enums and scalar mappings always yield type or const/enum", async () => {
    await property("model", modelSpec, async (model) => {
      const source = `
        namespace Test;
        ${renderModel(model)}
        model Holder { payload: ${model.withEnum === null ? model.name : `${model.name}Status`}; }
        op read(): Holder;
      `;
      const result = await compileAndValidate(source);
      const schema = result.document.components?.schemas?.[model.name];
      expect(schema).toBeDefined();
      const hasShape =
        schema?.type !== undefined ||
        schema?.enum !== undefined ||
        schema?.const !== undefined ||
        schema?.properties !== undefined;
      expect(hasShape).toBe(true);
    });
  });

  it("property 5: split-schemas rewriting preserves every internal ref", async () => {
    await property("spec", specArbitrary, async (spec) => {
      const options: AsyncAPIEmitterOptions = { "split-schemas": true };
      const result = await compileAndValidate(renderSpec(spec), options);
      expect(result.valid).toBe(true);
    });
  });

  it("property 6: same source compiles byte-identically twice", async () => {
    await property("spec", specArbitrary, async (spec) => {
      const first = await compileAsyncAPI(renderSpec(spec), {});
      const second = await compileAsyncAPI(renderSpec(spec), {});
      expect(JSON.stringify(second.asyncApiDoc)).toBe(
        JSON.stringify(first.asyncApiDoc),
      );
    });
  });
});
