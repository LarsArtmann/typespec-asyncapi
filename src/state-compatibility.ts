/**
 * TypeSpec AsyncAPI State Management Compatibility Layer
 *
 * Provides access to TypeSpec's stateMap for decorator data persistence.
 * Handles StateMapView (TypeSpec 1.8.0+) which is Map-like but not instanceof Map.
 */

import { type Program, type Type } from "@typespec/compiler";

/**
 * Get the state map for a given symbol from the TypeSpec program.
 *
 * Returns a Map-like object (StateMapView or Map) that supports
 * standard Map operations: get, set, has, entries, size, etc.
 */
export function getStateMap<T>(program: Program, symbol: symbol): Map<Type, T> {
  const programTyped = program as { stateMap?: (sym: symbol) => Map<Type, T> };

  if (typeof programTyped.stateMap !== "function") {
    throw new Error(
      `getStateMap: program.stateMap is not available. ` +
        `This typically means the TypeSpec compiler version is incompatible.`,
    );
  }

  const result = programTyped.stateMap(symbol);

  if (
    result &&
    typeof result === "object" &&
    "size" in result &&
    typeof result.get === "function"
  ) {
    return result;
  }

  throw new Error(
    `getStateMap: stateMap(${String(symbol)}) returned unexpected type: ${typeof result}. ` +
      `Expected a Map-like object.`,
  );
}

/**
 * Get a multi-value state map where each key maps to an array of values.
 * Used for decorators that can be applied multiple times to the same target.
 */
export function getMultiState<T>(program: Program, symbol: symbol): Map<Type, T[]> {
  const raw = getStateMap<T[] | T>(program, symbol);
  const multiMap = new Map<Type, T[]>();

  for (const [key, value] of raw) {
    if (Array.isArray(value)) {
      multiMap.set(key, value);
    } else if (value !== undefined) {
      multiMap.set(key, [value]);
    }
  }

  return multiMap;
}
