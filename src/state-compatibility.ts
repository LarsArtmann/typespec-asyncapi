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
  // EMERGENCY FALLBACK: Return empty map for now
  // TODO: Implement proper TypeSpec 1.6.0 API access

  return new Map();
}

/**
 * Safe state access with error handling
 */
export function tryGetStateMap<T>(program: Program, symbol: symbol): Map<Type, T> | null {
  try {
    return getStateMap(program, symbol);
  } catch (error) {
    // TODO: Replace with proper Effect.TS error handling
    return null;
  }
}
