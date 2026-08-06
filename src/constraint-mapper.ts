/**
 * Constraint Mapper — bridges TypeSpec stdlib decorators to JSON Schema keywords.
 *
 * TypeSpec provides 11 constraint/metadata decorators (`@minValue`, `@pattern`,
 * `@deprecated`, etc.) that users write on model properties. The compiler exposes
 * getter functions for each. This module reads those getters and merges the values
 * onto a `JsonSchema` object, producing the correct JSON Schema keywords.
 *
 * Validation keywords (minimum, pattern, etc.) are only applied to inline schemas.
 * When the schema is a `$ref`, validation siblings are semantically ignored by
 * JSON Schema Draft-07, so they are skipped. Metadata (`deprecated`) is always
 * applied, matching the existing pattern where `description` is set as a `$ref`
 * sibling by `collectModelProperties` in `schema-emitter.ts`.
 */

import type { Enum, Model, ModelProperty, Program, Scalar, Type, Union } from "@typespec/compiler";
import {
  getDoc,
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
 * Apply `@doc` decorator value to a schema's `description` keyword.
 * Works on any Type (model, property, enum, scalar).
 */
export function applyDocDescription(program: Program, target: Type, schema: JsonSchema): void {
  const doc = getDoc(program, target);
  if (doc) {
    schema.description = doc;
  }
}

/**
 * Apply `#deprecated` directive state to a schema's `deprecated` keyword.
 * Works on any Type (model, property, enum, scalar) since `isDeprecated`
 * checks compiler-level deprecation state set by the `#deprecated` directive.
 */
export function applyDeprecated(program: Program, target: Type, schema: JsonSchema): void {
  if (isDeprecated(program, target)) {
    schema.deprecated = true;
  }
}

/**
 * Apply `@summary` decorator value to a schema's `title` keyword.
 * Works on any Type (model, property, enum, scalar, union).
 */
export function applySummary(program: Program, target: Type, schema: JsonSchema): void {
  const summary = getSummary(program, target);
  if (summary !== undefined) {
    schema.title = summary;
  }
}

/**
 * Apply `@example` decorator values to a schema's `examples` keyword.
 * Uses `serializeValueAsJson` to convert TypeSpec Value types to plain JSON.
 */
export function applyExamples(program: Program, target: ExampleTarget, schema: JsonSchema): void {
  const examples = getExamples(program, target);
  if (examples.length > 0) {
    schema.examples = examples.map((ex) => serializeValueAsJson(program, ex.value, ex.value.type));
  }
}

/**
 * Apply `@visibility` decorator to `readOnly`/`writeOnly` keywords.
 * Maps TypeSpec Lifecycle visibility to JSON Schema:
 *   Read only → `readOnly: true`
 *   Create/Update only → `writeOnly: true`
 *   Both or neither → no keyword (fully visible)
 */
export function applyVisibility(program: Program, prop: ModelProperty, schema: JsonSchema): void {
  const lifecycle = getLifecycleVisibilityEnum(program);
  if (!lifecycle) {
    return;
  }

  const modifiers = getVisibilityForClass(program, prop, lifecycle);
  if (modifiers.size === 0) {
    return;
  }

  const names = new Set([...modifiers.values()].map((m) => m.name));
  const hasRead = names.has("Read");
  const hasWrite = names.has("Create") || names.has("Update");

  if (hasRead && !hasWrite) {
    schema.readOnly = true;
  } else if (hasWrite && !hasRead) {
    schema.writeOnly = true;
  }
}

/**
 * Apply TypeSpec default value (`prop: Type = value` syntax) to a schema's `default` keyword.
 * Uses `serializeValueAsJson` to convert TypeSpec Value to plain JSON.
 * `default` is an annotation keyword in JSON Schema, so it is applied even on `$ref` schemas.
 */
export function applyDefault(program: Program, prop: ModelProperty, schema: JsonSchema): void {
  if (prop.defaultValue) {
    schema.default = serializeValueAsJson(program, prop.defaultValue, prop.defaultValue.type);
  }
}

/**
 * Apply all metadata decorators/directives (doc, deprecated, summary, examples)
 * to a schema in one call. Used for model and enum declarations.
 */
export function applyMetadata(program: Program, target: ExampleTarget, schema: JsonSchema): void {
  applyDocDescription(program, target, schema);
  applyDeprecated(program, target, schema);
  applySummary(program, target, schema);
  applyExamples(program, target, schema);
}

export function applyConstraints(
  program: Program,
  prop: ModelProperty,
  schema: JsonSchema,
): JsonSchema {
  applyDocDescription(program, prop, schema);
  applyDeprecated(program, prop, schema);
  applySummary(program, prop, schema);
  applyExamples(program, prop, schema);
  applyDefault(program, prop, schema);
  applyVisibility(program, prop, schema);

  if (schema.$ref) {
    return schema;
  }

  const minVal = getMinValue(program, prop);
  if (minVal !== undefined) {
    schema.minimum = minVal;
  }

  const maxVal = getMaxValue(program, prop);
  if (maxVal !== undefined) {
    schema.maximum = maxVal;
  }

  const minExc = getMinValueExclusive(program, prop);
  if (minExc !== undefined) {
    schema.exclusiveMinimum = minExc;
  }

  const maxExc = getMaxValueExclusive(program, prop);
  if (maxExc !== undefined) {
    schema.exclusiveMaximum = maxExc;
  }

  const minLen = getMinLength(program, prop);
  if (minLen !== undefined) {
    schema.minLength = minLen;
  }

  const maxLen = getMaxLength(program, prop);
  if (maxLen !== undefined) {
    schema.maxLength = maxLen;
  }

  const pattern = getPattern(program, prop);
  if (pattern !== undefined) {
    schema.pattern = pattern;
  }

  const format = getFormat(program, prop);
  if (format !== undefined) {
    schema.format = format;
  }

  const minItems = getMinItems(program, prop);
  if (minItems !== undefined) {
    schema.minItems = minItems;
  }

  const maxItems = getMaxItems(program, prop);
  if (maxItems !== undefined) {
    schema.maxItems = maxItems;
  }

  return schema;
}
