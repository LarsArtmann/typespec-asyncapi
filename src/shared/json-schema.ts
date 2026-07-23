/**
 * Standard JSON Schema types for cross-emitter reuse.
 *
 * These types are independent of AsyncAPI-specific concepts. Other TypeSpec
 * emitters (OpenAPI, JSON Schema, etc.) can consume them directly.
 */

/**
 * A JSON Schema object following draft-07 / OpenAPI 3.x conventions.
 *
 * Structurally compatible with AsyncAPI Schema Object and OpenAPI Schema Object.
 * The index signature allows specification extensions (`x-*` keys).
 */
export interface JsonSchema {
  type?: string;
  format?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  items?: JsonSchema;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  const?: unknown;
  $ref?: string;
  title?: string;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  uniqueItems?: boolean;
  example?: unknown;
  examples?: unknown[];
  discriminator?: string;
  xml?: Record<string, unknown>;
  externalDocs?: { url: string; description?: string };
  [key: string]: unknown;
}

/** A `$ref` pointer to another schema. */
export interface SchemaRef {
  $ref: string;
}

/** A collection of named schemas, keyed by their component name. */
export type SchemaMap = Record<string, JsonSchema>;
