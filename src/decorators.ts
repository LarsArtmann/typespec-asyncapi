/**
 * TypeSpec AsyncAPI Decorators - Public API exports
 *
 * This module exports all AsyncAPI decorators for TypeSpec library integration.
 * These exports make decorators available when using "import "@lars-artmann/typespec-asyncapi"
 * in TypeSpec files and provide the JavaScript implementations for the extern dec declarations
 * in lib/main.tsp.
 */

/**
 * CRITICAL: TypeSpec namespace declaration
 *
 * This MUST match the library name in lib.ts (@lars-artmann/typespec-asyncapi)
 * TypeSpec uses this to link extern dec declarations to JS implementations
 */
export const namespace = "@lars-artmann/typespec-asyncapi";

// DEBUG: ONLY export minimal decorators for debugging
export { $channel, $server } from "./minimal-decorators.js";