/**
 * Cross-emitter shared schema API.
 *
 * Other TypeSpec emitters (OpenAPI, JSON Schema, etc.) can import from this
 * module to reuse the schema generation pipeline without pulling in
 * AsyncAPI-specific types.
 *
 * Usage:
 * ```ts
 * import {
 *   generateSchemas,
 *   type JsonSchema,
 *   type SchemaMap,
 * } from "@lars-artmann/typespec-asyncapi/shared";
 * ```
 */

export type { JsonSchema, SchemaRef, SchemaMap } from "./json-schema.js";

export { generateSchemas } from "../schema-generator.js";
export { extractValue } from "../extract-value.js";
export { intrinsicToSchema } from "../intrinsic-mapping.js";
export { AsyncAPISchemaEmitter } from "../schema-emitter.js";
