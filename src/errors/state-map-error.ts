/**
 * TypeSpec AsyncAPI Emitter - State Map Error
 * 
 * Branded Effect.TS error for missing stateMap method in TypeSpec program.
 * Used when program lacks required stateMap for decorator state management.
 */

import { Data } from "effect"

/**
 * Error indicating TypeSpec program missing stateMap method
 * 
 * @example
 * ```typescript
 * if (!context.program.stateMap) {
 *   return Effect.fail(new StateMapMissingError({
 *     message: "Program missing stateMap method",
 *     program: context.program
 *   }))
 * }
 * ```
 */
export class StateMapMissingError extends Data.TaggedError("StateMapMissingError")<{
  readonly message: string
  readonly program?: unknown
  readonly requiredMethods?: string[]
}> {
  get [Symbol.toStringTag]() {
    return "StateMapMissingError"
  }
}

/**
 * Factory function for creating StateMapMissingError with standardized message
 */
export const createStateMapMissingError = (details?: { program?: unknown }) =>
  new StateMapMissingError({
    message: "AsyncAPI Emitter Error: Program missing stateMap method. This is required for TypeSpec decorator state management. Ensure the TypeSpec compiler version is compatible and program initialization is complete.",
    program: details?.program,
    requiredMethods: ["stateMap", "getGlobalNamespaceType"]
  })