/**
 * @fileoverview TypeSpec AsyncAPI Library - Main entry point
 */

export * from "./lib.js";
export * from "./decorators.js";
export * from "./minimal-decorators.js";
export * from "./server-decorators.js";

// Emitter exports - use simple emitter (JSX emitter temporarily disabled)
export { $onEmit } from "./emitter.js";
export * from "./state.js";

export { $decorators } from "./decorators.js";

// Cross-emitter shared schema API
export type { JsonSchema, SchemaRef, SchemaMap } from "./shared/json-schema.js";
export { generateSchemas } from "./schema-generator.js";
export { extractValue } from "./extract-value.js";
export { intrinsicToSchema } from "./intrinsic-mapping.js";
export { AsyncAPISchemaEmitter } from "./schema-emitter.js";
