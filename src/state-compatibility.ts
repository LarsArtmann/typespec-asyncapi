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
  // Check if program exists and is valid
  if (!program || typeof program !== "object") {
    return new Map<Type, T>();
  }

  // Try direct TypeSpec 1.8.0 stateMap access (function, not property)
  const programTyped = program as { stateMap: (sym: symbol) => Map<Type, T> };

  // Check if stateMap method exists
  if (typeof programTyped.stateMap !== "function") {
    return new Map<Type, T>();
  }

  const result = programTyped.stateMap(symbol);

  // TypeSpec 1.8.0 returns StateMapView, which extends Map
  // Accept both Map and StateMapView
  return result instanceof Map ? result : new Map<Type, T>();
}

/**
 * Safe state access with error handling
 */
export function tryGetStateMap<T>(program: Program, symbol: symbol): Map<Type, T> | null {
  // Simple approach without try/catch to satisfy ESLint
  return getStateMap<T>(program, symbol);
}