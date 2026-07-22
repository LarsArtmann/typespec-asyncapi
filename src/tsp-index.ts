/**
 * TypeSpec AsyncAPI Library - Main TypeSpec integration entry point
 *
 * Provides namespace and decorator exports for TypeSpec compiler integration.
 * This file is imported by lib/main.tsp to complete TypeSpec library setup.
 */

export { $decorators } from "./decorators.js";
export { $lib } from "./lib.js";
export const namespace = "TypeSpec.AsyncAPI";
