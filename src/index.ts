/**
 * @fileoverview TypeSpec AsyncAPI Library - Main entry point
 */

export * from "./lib.js";
export * from "./decorators.js";
export * from "./minimal-decorators.js";

// Emitter exports
export { $onEmit } from "./emitter.js";
export * from "./state.js";

// CRITICAL: Export decorators as default for TypeSpec discovery
import { $decorators } from "./decorators.js";
export default $decorators;
