/**
 * Standard JSON Schema types for cross-emitter reuse.
 *
 * These types are independent of AsyncAPI-specific concepts. Other TypeSpec
 * emitters (OpenAPI, JSON Schema, etc.) can consume them directly.
 *
 * `JsonSchema` is defined once in the domain model and re-exported here so
 * consumers of the shared API get the same type without a split-brain.
 */

import type { JsonSchema } from "../domain/models/asyncapi-document.js";

export type { JsonSchema } from "../domain/models/asyncapi-document.js";

/** A `$ref` pointer to another schema. */
export interface SchemaRef {
  $ref: string;
}

/** A collection of named schemas, keyed by their component name. */
export type SchemaMap = Record<string, JsonSchema>;
