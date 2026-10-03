/**
 * TypeSpec AsyncAPI Library - Main TypeSpec integration entry point
 *
 * Provides namespace and decorator exports for TypeSpec compiler integration.
 * This file is imported by lib/main.tsp to complete TypeSpec library setup.
 */

export { $decorators } from "./decorators.js";
export { $onValidate } from "./builders/cross-emitter-validation.js";
export { $lib } from "./lib.js";
export const namespace = "TypeSpec.AsyncAPI";
