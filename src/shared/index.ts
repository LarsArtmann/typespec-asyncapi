/**
 * Cross-emitter shared schema API.
 *
 * Exports are split into two tiers by neutrality:
 *
 * **Protocol-neutral** (no AsyncAPI dependency — safe for any JSON Schema emitter):
 * - Types: `JsonSchema`, `SchemaRef`, `SchemaMap`
 * - Utilities: `extractValue`, `intrinsicToSchema`
 *
 * **AsyncAPI-bound convenience** (require `AsyncAPIEmitterOptions` / the AsyncAPI `$lib`):
 * - `generateSchemas` — drives the asset-emitter pipeline for the AsyncAPI context
 * - `AsyncAPISchemaEmitter` — the `TypeEmitter` subclass that maps TypeSpec to JSON Schema
 *
 * A standalone OpenAPI/JSON-Schema emitter can reuse the neutral tier directly. The
 * AsyncAPI-bound tier is re-exported here so consumers that already depend on this
 * package need no second import path, but a truly protocol-agnostic emitter would
 * subclass `TypeEmitter` with its own options type.
 *
 * Usage:
 * ```ts
 * import {
 *   generateSchemas,
 *   extractValue,
 *   intrinsicToSchema,
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
