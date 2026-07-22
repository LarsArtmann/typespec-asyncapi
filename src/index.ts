/**
 * @fileoverview TypeSpec AsyncAPI Library - Main entry point
 */

export * from "./lib.js";
export * from "./decorators.js";
export * from "./minimal-decorators.js";

// Emitter exports - use simple emitter (JSX emitter temporarily disabled)
export { $onEmit } from "./emitter.js";
export * from "./state.js";

export { $decorators } from "./decorators.js";
