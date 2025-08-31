/**
 * AsyncAPI Emitter Options - Main entry point
 *
 * This file provides a clean interface for AsyncAPI emitter options
 * by aggregating all functionality from the split modules.
 */

// Re-export types
export type {
	AsyncAPIEmitterOptions,
	VersioningConfig,
	ServerConfig,
	VariableConfig,
	SecuritySchemeConfig,
	OAuthFlowsConfig,
	OAuthFlowConfig
} from "./options/types"

// Re-export schemas
export {AsyncAPIEmitterOptionsEffectSchema} from "./options/schemas"

// Re-export validation functions
export {parseAsyncAPIEmitterOptions, validateAsyncAPIEmitterOptions} from "./options/validation"

// Re-export utility functions and JSONSchema compatibility
export {AsyncAPIEmitterOptionsSchema, createAsyncAPIEmitterOptions, isAsyncAPIEmitterOptions} from "./options/utils"