/**
 * TypeSpec AsyncAPI Emitter - Global Namespace Error
 * 
 * Branded Effect.TS error for missing or invalid global namespace in TypeSpec program.
 * Used when program.getGlobalNamespaceType is missing or returns invalid namespace.
 */

import { Data } from "effect"

/**
 * Error indicating TypeSpec program missing getGlobalNamespaceType method
 * 
 * @example
 * ```typescript
 * if (!context.program.getGlobalNamespaceType) {
 *   return Effect.fail(new GlobalNamespaceMissingError({
 *     message: "Program missing getGlobalNamespaceType method",
 *     program: context.program
 *   }))
 * }
 * ```
 */
export class GlobalNamespaceMissingError extends Data.TaggedError("GlobalNamespaceMissingError")<{
  readonly message: string
  readonly program?: unknown
  readonly expectedMethods?: string[]
}> {
  get [Symbol.toStringTag]() {
    return "GlobalNamespaceMissingError"
  }
}

/**
 * Error indicating invalid global namespace structure
 * 
 * @example
 * ```typescript
 * if (globalNamespace.kind !== "Namespace") {
 *   return Effect.fail(new GlobalNamespaceInvalidError({
 *     message: "Invalid global namespace structure",
 *     receivedKind: globalNamespace.kind,
 *     expectedKind: "Namespace"
 *   }))
 * }
 * ```
 */
export class GlobalNamespaceInvalidError extends Data.TaggedError("GlobalNamespaceInvalidError")<{
  readonly message: string
  readonly receivedKind?: string
  readonly expectedKind: "Namespace"
  readonly namespace?: unknown
}> {
  get [Symbol.toStringTag]() {
    return "GlobalNamespaceInvalidError"
  }
}

/**
 * Error indicating failure to access global namespace
 */
export class GlobalNamespaceAccessError extends Data.TaggedError("GlobalNamespaceAccessError")<{
  readonly message: string
  readonly cause: unknown
  readonly program?: unknown
}> {
  get [Symbol.toStringTag]() {
    return "GlobalNamespaceAccessError"
  }
}

/**
 * Factory functions for creating GlobalNamespace errors with standardized messages
 */
export const createGlobalNamespaceMissingError = (details?: { program?: unknown }) =>
  new GlobalNamespaceMissingError({
    message: "AsyncAPI Emitter Error: Program missing getGlobalNamespaceType method. This indicates an incomplete or corrupted TypeSpec program. Ensure the TypeSpec compiler properly initialized the program object.",
    program: details?.program,
    expectedMethods: ["getGlobalNamespaceType", "stateMap"]
  })

export const createGlobalNamespaceInvalidError = (receivedKind?: string) =>
  new GlobalNamespaceInvalidError({
    message: `AsyncAPI Emitter Error: Invalid global namespace structure. Expected Namespace but got: ${receivedKind || "undefined"}`,
    expectedKind: "Namespace",
    ...(receivedKind ? { receivedKind } : {})
  })

export const createGlobalNamespaceAccessError = (cause: unknown, program?: unknown) =>
  new GlobalNamespaceAccessError({
    message: `AsyncAPI Emitter Error: Failed to access global namespace: ${cause instanceof Error ? cause.message : String(cause)}`,
    cause,
    program
  })