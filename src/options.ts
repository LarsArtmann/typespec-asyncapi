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
} from "./options/types.js"

// Re-export schemas
export {AsyncAPIEmitterOptionsEffectSchema} from "./options/schemas.js"

// Re-export validation functions
export {parseAsyncAPIEmitterOptions, validateAsyncAPIEmitterOptions} from "./options/validation.js"

// Re-export utility functions and JSONSchema compatibility
export {ASYNC_API_EMITTER_OPTIONS_SCHEMA, createAsyncAPIEmitterOptions, isAsyncAPIEmitterOptions} from "./options/utils.js"