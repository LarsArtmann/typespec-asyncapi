/**
 * Constraint Mapper — bridges TypeSpec stdlib decorators to JSON Schema keywords.
 *
 * TypeSpec provides 16 constraint/metadata mappings (`@minValue`, `@pattern`,
 * `@doc`, `#deprecated`, `= defaults`, etc.) that users apply to model
 * properties and declarations. The compiler exposes getter functions for each.
 * This module reads those getters and merges the values onto a `JsonSchema`
 * object, producing the correct JSON Schema keywords.
 *
 * Validation keywords (minimum, pattern, etc.) are only applied to inline
 * schemas. When the schema is a `$ref`, validation siblings are semantically
 * ignored by JSON Schema Draft-07, so they are skipped. Metadata
 * (`deprecated`, `description`, `title`, `examples`, `default`) is always
 * applied as `$ref` siblings.
 */

import type {
  Enum,
  Model,
  ModelProperty,
  Program,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import {
  getDoc,
  getEncode,
  getExamples,
  getFormat,
  getLifecycleVisibilityEnum,
  getMaxLength,
  getMaxItems,
  getMaxValue,
  getMaxValueExclusive,
  getMinLength,
  getMinItems,
  getMinValue,
  getMinValueExclusive,
  getPattern,
  getSummary,
  getVisibilityForClass,
  isDeprecated,
  serializeValueAsJson,
} from "@typespec/compiler";
import type { JsonSchema } from "./domain/models/asyncapi-document.js";

/** Types that accept `@example` per TypeSpec stdlib. */
type ExampleTarget = Model | Scalar | Enum | Union | ModelProperty;

/**
 * Validation-constraint mapping table: each entry pairs a TypeSpec getter
 * with the JSON Schema keyword it maps to. Iterated in `applyConstraints`
 * via a single loop, replacing 10 structurally identical if-blocks.
 */
interface ConstraintEntry {
  getter: (p: Program, t: ModelProperty) => number | string | undefined;
  keyword: string;
}

const CONSTRAINT_TABLE: readonly ConstraintEntry[] = [
  { getter: getMinValue, keyword: "minimum" },
  { getter: getMaxValue, keyword: "maximum" },
  { getter: getMinValueExclusive, keyword: "exclusiveMinimum" },
  { getter: getMaxValueExclusive, keyword: "exclusiveMaximum" },
  { getter: getMinLength, keyword: "minLength" },
  { getter: getMaxLength, keyword: "maxLength" },
  { getter: getPattern, keyword: "pattern" },
  { getter: getFormat, keyword: "format" },
  { getter: getMinItems, keyword: "minItems" },
  { getter: getMaxItems, keyword: "maxItems" },
];

/**
 * Safely resolve `@encode` data for any target type. `getEncode` only accepts
 * `ModelProperty | Scalar`, so non-encodable types (Model, Enum, Union) return
 * `undefined`.
 */
function resolveEncode(
  program: Program,
  target: Type,
): ReturnType<typeof getEncode> {
  return target.kind === "ModelProperty" || target.kind === "Scalar"
    ? getEncode(program, target)
    : undefined;
}

/**
 * Apply all metadata decorators/directives (doc, deprecated, summary, examples)
 * to a schema in one call. Used for model, enum, and scalar declarations.
 */
export function applyMetadata(
  program: Program,
  target: ExampleTarget,
  schema: JsonSchema,
): void {
  const doc = getDoc(program, target);
  if (doc) {
    schema.description = doc;
  }

  if (isDeprecated(program, target)) {
    schema.deprecated = true;
  }

  const summary = getSummary(program, target);
  if (summary !== undefined) {
    schema.title = summary;
  }

  const examples = getExamples(program, target);
  if (examples.length > 0) {
    const encode = resolveEncode(program, target);
    schema.examples = examples.map((ex) =>
      serializeValueAsJson(program, ex.value, ex.value.type, encode),
    );
  }
}

/**
 * Apply all constraints and metadata to a model property's schema.
 *
 * Metadata (doc, deprecated, summary, examples, default, visibility) is
 * applied first — these survive as `$ref` siblings. Validation keywords
 * (minimum, pattern, etc.) are skipped when the schema is a `$ref`.
 *
 * @returns the same `schema` object (for chaining).
 */
export function applyConstraints(
  program: Program,
  prop: ModelProperty,
  schema: JsonSchema,
): JsonSchema {
  applyMetadata(program, prop, schema);

  if (prop.defaultValue) {
    schema.default = serializeValueAsJson(
      program,
      prop.defaultValue,
      prop.defaultValue.type,
      resolveEncode(program, prop),
    );
  }

  // @visibility → readOnly/writeOnly (annotation keywords, survive as $ref siblings)
  const lifecycle = getLifecycleVisibilityEnum(program);
  if (lifecycle) {
    const modifiers = getVisibilityForClass(program, prop, lifecycle);
    if (modifiers.size > 0) {
      const names = new Set([...modifiers.values()].map((m) => m.name));
      const hasRead = names.has("Read");
      const hasWrite = names.has("Create") || names.has("Update");
      if (hasRead && !hasWrite) {
        schema.readOnly = true;
      } else if (hasWrite && !hasRead) {
        schema.writeOnly = true;
      }
    }
  }

  if (schema.$ref) {
    return schema;
  }

  for (const { getter, keyword } of CONSTRAINT_TABLE) {
    const val = getter(program, prop);
    if (val !== undefined) {
      schema[keyword] = val;
    }
  }

  return schema;
}
