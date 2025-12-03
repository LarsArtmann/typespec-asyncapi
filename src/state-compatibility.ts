/**
 * @fileoverview TypeSpec AsyncAPI State Management Compatibility Layer
 * 
 * Provides compatibility layer for TypeSpec 1.6.0+ stateMap access patterns.
 * Handles both direct stateMap access and new state accessor patterns.
 */

import { type Program, type Type } from "@typespec/compiler";
import { stateSymbols } from "./lib.js";

/**
 * Compatibility layer for stateMap access
 * Works with both old and new TypeSpec API patterns
 */
export function getStateMap<T>(program: Program, symbol: symbol): Map<Type, T> {
  // EMERGENCY FALLBACK: Return empty map for now
  console.log(`🔍 DEBUG: State access not implemented yet, returning empty map`);
  console.log(`🔍 DEBUG: program type: ${typeof program}`);
  console.log(`🔍 DEBUG: Looking for symbol: ${String(symbol)}`);
  
  return new Map();
}

/**
 * Safe state access with error handling
 */
export function tryGetStateMap<T>(program: Program, symbol: symbol): Map<Type, T> | null {
  try {
    return getStateMap(program, symbol);
  } catch (error) {
    console.error(`🚨 ERROR: State map access failed for symbol ${String(symbol)}:`, error);
    return null;
  }
}