/**
 * TypeSpec AsyncAPI Emitter - Branded Error Exports
 * 
 * Centralized exports for all Effect.TS branded error classes.
 * Provides type-safe, composable error handling for the AsyncAPI emitter.
 */

// Compiler Options Errors
export {
  type CompilerOptionsError,
  createCompilerOptionsError
} from "./compiler-options-error.js"

// Global Namespace Errors
export {
  type GlobalNamespaceMissingError,
  type GlobalNamespaceInvalidError,
  type GlobalNamespaceAccessError,
  createGlobalNamespaceMissingError,
  createGlobalNamespaceInvalidError,
  createGlobalNamespaceAccessError
} from "./global-namespace-error.js"

// State Map Errors
export {
  type StateMapMissingError,
  createStateMapMissingError
} from "./state-map-error.js"

// Plugin Errors
export {
  type PluginSystemError,
  createPluginSystemError
} from "./plugin-error.js"

// Import types for union type
import type { CompilerOptionsError } from "./compiler-options-error.js"
import type { 
  GlobalNamespaceMissingError,
  GlobalNamespaceInvalidError, 
  GlobalNamespaceAccessError
} from "./global-namespace-error.js"
import type { StateMapMissingError } from "./state-map-error.js"
import type { PluginSystemError } from "./plugin-error.js"

/**
 * Union type of all AsyncAPI emitter errors for comprehensive error handling
 */
export type AsyncAPIEmitterError = 
  | CompilerOptionsError
  | GlobalNamespaceMissingError
  | GlobalNamespaceInvalidError
  | GlobalNamespaceAccessError
  | StateMapMissingError
  | PluginSystemError