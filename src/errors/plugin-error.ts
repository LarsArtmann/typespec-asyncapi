/**
 * TypeSpec AsyncAPI Emitter - Plugin System Error
 * 
 * Branded Effect.TS error for plugin system failures.
 * Used when plugin initialization or execution fails.
 */

import { Data } from "effect"

/**
 * Error indicating plugin system initialization failure
 * 
 * @example
 * ```typescript
 * yield* Effect.tryPromise(() => initializePlugins()).pipe(
 *   Effect.catchAll((error) => Effect.fail(new PluginSystemError({
 *     message: "Plugin initialization failed",
 *     cause: error
 *   })))
 * )
 * ```
 */
export class PluginSystemError extends Data.TaggedError("PluginSystemError")<{
  readonly message: string
  readonly cause: unknown
  readonly pluginName?: string
}> {
  get [Symbol.toStringTag]() {
    return "PluginSystemError"
  }
}

/**
 * Factory function for creating PluginSystemError with standardized message
 */
export const createPluginSystemError = (cause: unknown, pluginName?: string) =>
  new PluginSystemError({
    message: `AsyncAPI Emitter Error: Plugin system initialization failed${pluginName ? ` for plugin: ${pluginName}` : ''}. Continuing without plugins.`,
    cause,
    pluginName
  })