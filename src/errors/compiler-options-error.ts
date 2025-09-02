/**
 * TypeSpec AsyncAPI Emitter - Compiler Options Error
 * 
 * Branded Effect.TS error for missing or invalid compiler options in TypeSpec program.
 * Used when the program lacks required compilerOptions object needed for AssetEmitter.
 */

import { Data } from "effect"

/**
 * Error indicating TypeSpec program missing required compilerOptions
 * 
 * @example
 * ```typescript
 * if (!context.program.compilerOptions) {
 *   return Effect.fail(new CompilerOptionsError({
 *     message: "Program missing required compilerOptions",
 *     program: context.program
 *   }))
 * }
 * ```
 */
export class CompilerOptionsError extends Data.TaggedError("CompilerOptionsError")<{
  readonly message: string
  readonly program?: unknown
  readonly requiredOptions?: string[]
}> {
  get [Symbol.toStringTag]() {
    return "CompilerOptionsError"
  }
}

/**
 * Factory function for creating CompilerOptionsError with standardized message
 */
export const createCompilerOptionsError = (details?: { program?: unknown }) =>
  new CompilerOptionsError({
    message: "AsyncAPI Emitter Error: Program missing required compilerOptions. Ensure TypeSpec compiler is properly configured with compilerOptions object.",
    program: details?.program,
    requiredOptions: ["dryRun"]
  })