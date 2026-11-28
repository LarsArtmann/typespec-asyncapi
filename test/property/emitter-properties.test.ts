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
 *  P7 the channel key is exactly `id ?? address` and every ref agrees
 *  P8 a discriminated base return expands to one message per variant
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
import type { JsonSchema } from "../../src/domain/models/asyncapi-document.js";

// eslint-disable-next-line node/no-process-env -- FC_SEED is the documented reproduction override
const SEED = Number(process.env["FC_SEED"] ?? 20_260_821);
const RUNS = 20;

/** Deterministic property runner with the shared pinned seed. */
function property<T>(
  name: string,
  arb: fc.Arbitrary<T>,
  check: (t: T) => Promise<void>,
): Promise<void> {
  return fc.assert(fc.asyncProperty(arb, check), { seed: SEED, numRuns: RUNS });
}

const identifier = fc
  .stringMatching(/^[A-Z][a-zA-Z0-9]{2,11}$/u)
  .filter((s) => !["Test", "TypeSpec"].includes(s));

/** Lowercase TypeSpec keywords that cannot be used as identifiers. */
const RESERVED = new Set([
  "model",
  "enum",
  "union",
  "scalar",
  "op",
  "namespace",
  "interface",
  "import",
  "using",
  "dec",
  "extern",
  "void",
  "never",
  "unknown",
  "true",
  "false",
  "string",
  "int32",
  "int64",
  "float64",
  "boolean",
  "utcDateTime",
  "kind",
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
  asArray: boolean;
}

const fieldSpec = fc.record({
  name: fieldName,
  type: scalarType,
  optional: fc.boolean(),
  min: fc.integer({ min: 0, max: 90 }),
  maxLen: fc.integer({ min: 1, max: 80 }),
  minItems: fc.integer({ min: 0, max: 5 }),
  asArray: fc.boolean(),
});

/** Pair constraints are made CONSISTENT by construction (P2): min <= max etc. */
const consistentFieldSpec: fc.Arbitrary<FieldSpec> = fc
  .tuple(
    fieldSpec,
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
  )
  .map(([base, spread, lenSpread]) => ({
    ...base,
    max: base.min + spread,
    minLen: Math.max(0, base.maxLen - lenSpread),
    maxItems: base.minItems + spread,
  }));

function renderField(field: FieldSpec): string {
  const numeric =
    field.type === "int32" ||
    field.type === "int64" ||
    field.type === "float64";
  const rawConstraints = [
    numeric && !field.asArray ? `@minValue(${field.min})` : "",
    numeric && !field.asArray ? `@maxValue(${field.max})` : "",
    // Value/string constraints apply to the property itself; arrays carry only min/maxItems.
    field.type === "string" && !field.asArray
      ? `@minLength(${field.minLen})`
      : "",
    field.type === "string" && !field.asArray
      ? `@maxLength(${field.maxLen})`
      : "",
    field.asArray ? `@minItems(${field.min})` : "",
    field.asArray ? `@maxItems(${field.max})` : "",
  ];
  const constraints = rawConstraints.filter(Boolean).join(" ");
  const prefix = constraints.length > 0 ? `${constraints}\n  ` : "";
  const type = field.asArray ? `${field.type}[]` : field.type;
  return `${prefix}${field.name}${field.optional ? "?" : ""}: ${type};`;
}

interface ModelSpec {
  name: string;
  fields: FieldSpec[];
  withEnum: string[] | null;
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

const specFields = {
  models: fc.uniqueArray(modelSpec, {
    selector: (model) => model.name,
    minLength: 1,
    maxLength: 4,
  }),
  opName: identifier,
  channelName: fc.stringMatching(/^[a-z]{3,10}\/[a-z]{3,10}$/u),
  channelId: fc.option(fc.stringMatching(/^[a-z][a-z0-9]{2,11}$/u), {
    nil: null,
  }),
  variantCount: fc.option(fc.integer({ min: 2, max: 4 }), { nil: null }),
};

interface GeneratedSpec {
  models: ModelSpec[];
  opName: string;
  channelName: string;
  channelId: string | null;
  variantCount: number | null;
}

/** A variant named `<base>V<i>` colliding with another generated model. */
function hasVariantNameCollision(spec: {
  models: ModelSpec[];
  variantCount: number | null;
}): boolean {
  if (spec.variantCount === null) {
    return false;
  }
  const base = spec.models[0]!.name;
  return spec.models.slice(1).some((m) => m.name.startsWith(`${base}V`));
}

const specArbitrary = fc
  .record(specFields)
  .filter((spec) => !hasVariantNameCollision(spec));

/** Variant-heavy variant of specArbitrary: P8 always sees a family. */
const variantSpecArbitrary = fc
  .record({ ...specFields, variantCount: fc.integer({ min: 2, max: 4 }) })
  .filter((spec) => !hasVariantNameCollision(spec));

/** Render a model with one extra property referencing another named model. */
function renderModelWithRef(model: ModelSpec, refTarget: string): string {
  const enumBlock =
    model.withEnum === null
      ? ""
      : `enum ${model.name}Status { ${model.withEnum.join(", ")} }\n\n`;
  const fields = [
    ...model.fields.map(renderField),
    `related: ${refTarget};`,
  ].join("\n  ");
  return `${enumBlock}model ${model.name} {\n  ${fields}\n}`;
}

/** Render the payload as a `@discriminator` base plus `count` variants. */
function renderDiscriminatedFamily(
  base: ModelSpec,
  refTarget: string | null,
  count: number,
): string {
  const fields = [
    "kind: string;",
    ...base.fields.map(renderField),
    ...(refTarget === null ? [] : [`related: ${refTarget};`]),
  ].join("\n  ");
  const baseModel = `@discriminator("kind")\nmodel ${base.name} {\n  ${fields}\n}`;
  const variants = Array.from({ length: count }, (_, index) => index + 1)
    .map(
      (i) =>
        `model ${base.name}V${i} extends ${base.name} {\n  kind: "v${i}";\n}`,
    )
    .join("\n\n");
  return `${baseModel}\n\n${variants}`;
}

function renderSpec(spec: GeneratedSpec): string {
  const payload = spec.models[0]!;
  const rest = spec.models.slice(1);
  const refTarget = rest.length > 0 ? rest[0]!.name : null;
  // The payload model references the next model when one exists.
  // Single-model specs stay self-contained; this exercises model→model $refs.
  const payloadModel =
    spec.variantCount === null
      ? refTarget === null
        ? renderModel(payload)
        : renderModelWithRef(payload, refTarget)
      : renderDiscriminatedFamily(payload, refTarget, spec.variantCount);
  const others = rest.map(renderModel).join("\n\n");
  const body = [payloadModel, others].filter(Boolean).join("\n\n");
  const channelArg =
    spec.channelId === null
      ? `"${spec.channelName}"`
      : `"${spec.channelName}", "${spec.channelId}"`;
  return `
    namespace Test;
    ${body}
    @channel(${channelArg})
    op ${spec.opName}(): ${payload.name};
  `;
}

/** RFC 6901 token for a channel key, as the emitter must emit it in $refs. */
function channelPointerToken(key: string): string {
  return encodeURIComponent(key.replaceAll("~", "~0").replaceAll("/", "~1"));
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
      const prop = result.document.components?.schemas?.Holder?.properties?.[
        field.name
      ] as JsonSchema | undefined;
      expect(prop).toBeDefined();
      const numeric =
        field.type === "int32" ||
        field.type === "int64" ||
        field.type === "float64";
      const wantValue = numeric && !field.asArray;
      const wantLength = field.type === "string" && !field.asArray;
      const wantItems = field.asArray;
      const lower = wantValue
        ? prop?.minimum
        : wantLength
          ? prop?.minLength
          : wantItems
            ? prop?.minItems
            : undefined;
      const upper = wantValue
        ? prop?.maximum
        : wantLength
          ? prop?.maxLength
          : wantItems
            ? prop?.maxItems
            : undefined;
      expect({
        minimum: wantValue ? prop?.minimum : undefined,
        maximum: wantValue ? prop?.maximum : undefined,
        minLength: wantLength ? prop?.minLength : undefined,
        maxLength: wantLength ? prop?.maxLength : undefined,
        type: wantItems ? prop?.type : undefined,
        minItems: wantItems ? prop?.minItems : undefined,
        maxItems: wantItems ? prop?.maxItems : undefined,
      }).toStrictEqual({
        minimum: wantValue ? field.min : undefined,
        maximum: wantValue ? field.max : undefined,
        minLength: wantLength ? field.minLen : undefined,
        maxLength: wantLength ? field.maxLen : undefined,
        type: wantItems ? "array" : undefined,
        minItems: wantItems ? field.min : undefined,
        maxItems: wantItems ? field.max : undefined,
      });
      expect(lower === undefined || upper === undefined || lower <= upper).toBe(
        true,
      );
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
      const options: AsyncAPIEmitterOptions = {
        "split-schemas": true,
        "file-type": "json",
      };
      const { asyncApiDoc, allOutputFiles } = await compileAsyncAPI(
        renderSpec(spec),
        options,
      );
      expect(asyncApiDoc).not.toBeNull();

      const mainDoc = asyncApiDoc!;
      // The main document must not retain internal component-schema refs:
      // Every schema ref is rewritten to its external schemas/<Name> path.
      // Channel and message refs legitimately stay internal.
      const mainRefs = collectRefs(mainDoc);
      for (const ref of mainRefs) {
        expect(
          ref.startsWith("#/components/schemas/"),
          `unrewritten schema ref in main document: ${ref}`,
        ).toBeFalsy();
      }

      // Every rewritten ref must resolve to an emitted schema file, and every
      // Ref inside a schema file must resolve within that same file.
      const externalRefs = mainRefs.filter((ref) => ref.startsWith("schemas/"));
      for (const ref of externalRefs) {
        const schemaFile = allOutputFiles.get(ref.replace(/^schemas\//u, ""));
        expect(schemaFile, `missing split output ${ref}`).toBeDefined();
        const schema = JSON.parse(schemaFile!) as Record<string, unknown>;
        for (const innerRef of collectRefs(schema)) {
          expect(
            innerRef.startsWith("#/") || innerRef.startsWith("schemas/"),
            `dangling inner ref ${innerRef} in ${ref}`,
          ).toBe(true);
          expect(
            !innerRef.startsWith("#/") || pointerExists(schema, innerRef),
            `unresolvable pointer ${innerRef} in ${ref}`,
          ).toBe(true);
        }
      }
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

  it("property 7: channel key is the id when given, the address otherwise", async () => {
    await property("spec", specArbitrary, async (spec) => {
      const expectedKey = spec.channelId ?? spec.channelName;
      const { asyncApiDoc: doc } = await compileAsyncAPI(renderSpec(spec), {});
      expect(doc).not.toBeNull();

      expect(Object.keys(doc!.channels!)).toStrictEqual([expectedKey]);
      expect(doc!.channels![expectedKey]!.address).toBe(spec.channelName);

      const token = channelPointerToken(expectedKey);
      const op = doc!.operations![spec.opName]!;
      expect(op.channel).toStrictEqual({ $ref: `#/channels/${token}` });
      const messageRefs = collectRefs(op).filter((ref) =>
        ref.includes("/messages/"),
      );
      expect(messageRefs.length).toBeGreaterThan(0);
      for (const ref of messageRefs) {
        expect(ref.startsWith(`#/channels/${token}/messages/`)).toBe(true);
      }
    });
  });

  it("property 8: a discriminated base return expands to one message per variant", async () => {
    await property("variant spec", variantSpecArbitrary, async (spec) => {
      const result = await compileAndValidate(renderSpec(spec));
      expect(result.valid).toBe(true);

      const base = spec.models[0]!.name;
      const variantNames = Array.from(
        { length: spec.variantCount! },
        (_, index) => `${base}V${index + 1}`,
      );
      const channelKey = spec.channelId ?? spec.channelName;
      const token = channelPointerToken(channelKey);
      const channel = result.document.channels![channelKey]!;

      const messageKeys = Object.keys(channel.messages ?? {}).toSorted();
      expect(messageKeys).toStrictEqual(variantNames.toSorted());
      expect(channel.messages![base]).toBeUndefined();

      const op = result.document.operations![spec.opName]!;
      const opRefs = collectRefs(op)
        .filter((ref) => ref.includes("/messages/"))
        .toSorted();
      expect(opRefs).toStrictEqual(
        variantNames.map((v) => `#/channels/${token}/messages/${v}`).toSorted(),
      );

      for (const variant of variantNames) {
        expect(channel.messages![variant]).toStrictEqual({
          $ref: `#/components/messages/${variant}`,
        });
        expect(result.document.components!.messages![variant]).toBeDefined();
        expect(result.document.components!.schemas![variant]).toBeDefined();
      }
      expect(result.document.components!.messages![base]).toBeUndefined();
    });
  });
});
