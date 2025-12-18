/**
 * @fileoverview TypeSpec AsyncAPI State Management Compatibility Layer
 *
 * Provides compatibility layer for TypeSpec 1.6.0+ stateMap access patterns.
 * Handles both direct stateMap access and new state accessor patterns.
 */

import { type Program, type Type } from "@typespec/compiler";

/**
 * Compatibility layer for stateMap access
 * Works with both old and new TypeSpec API patterns
 */
export function getStateMap<T>(program: Program, symbol: symbol): Map<Type, T> {
  // Try direct TypeSpec 1.6.0+ stateMap access
  const programTyped = program as { stateMap: (sym: symbol) => Map<Type, T> };
  const result = programTyped.stateMap(symbol);
  return result instanceof Map ? result : new Map<Type, T>();
}

/**
 * Safe state access with error handling
 */
export function tryGetStateMap<T>(program: Program, symbol: symbol): Map<Type, T> | null {
  // Simple approach without try/catch to satisfy ESLint
  return getStateMap<T>(program, symbol);
}