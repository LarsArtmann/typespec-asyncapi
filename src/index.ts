/**
 * @fileoverview TypeSpec AsyncAPI Library - Main entry point
 */

export * from "./lib.js";
export * from "./decorators.js";
export * from "./minimal-decorators.js";

// Emitter exports
export { $onEmit } from "./emitter.js";
export * from "./state.js";

// CRITICAL: Export decorators for TypeSpec library discovery
import { $decorators } from "./decorators.js";
export { $decorators };
