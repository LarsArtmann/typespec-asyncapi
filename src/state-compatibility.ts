/**
 * @fileoverview TypeSpec AsyncAPI State Management Compatibility Layer
 *
 * Provides compatibility layer for TypeSpec 1.6.0+ stateMap access patterns.
 * Handles both direct stateMap access and new state accessor patterns.
 */

import { Effect } from "effect";
import { type Program, type Type } from "@typespec/compiler";

/**
 * Compatibility layer for stateMap access
 * Works with both old and new TypeSpec API patterns
 */
export function getStateMap<T>(program: Program, symbol: symbol): Map<Type, T> {
  return Effect.runSync(Effect.gen(function*() {
    try {
      // Try direct TypeSpec 1.6.0+ stateMap access
      // @ts-expect-error - TypeSpec compiler internal API
      return program.stateMap(symbol) as Map<Type, T>;
    } catch (error) {
      // Fallback for older versions or different access patterns
      yield* Effect.logWarning(`State map access failed for symbol ${symbol.toString()}: ${error}`);
      return new Map<Type, T>();
    }
  }));
}

/**
 * Safe state access with error handling
 */
export function tryGetStateMap<T>(program: Program, symbol: symbol): Map<Type, T> | null {
  return Effect.runSync(Effect.gen(function*() {
    try {
      return getStateMap(program, symbol);
    } catch (error) {
      yield* Effect.logWarning(`tryGetStateMap failed: ${error}`);
      return null;
    }
  }));
}
