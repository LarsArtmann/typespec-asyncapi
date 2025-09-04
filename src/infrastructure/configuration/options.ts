/**
 * AsyncAPI Emitter Options - Main entry point
 *
 * This file provides a clean interface for AsyncAPI emitter options
 * by aggregating all functionality from the split modules.
 */

// Re-export types

// Re-export schemas
export {asyncAPIEmitterOptionsEffectSchema} from "./schemas.js"

// Re-export validation functions
export {parseAsyncAPIEmitterOptions, validateAsyncAPIEmitterOptions} from "./validation.js"

// Re-export utility functions and JSONSchema compatibility
export {
	ASYNC_API_EMITTER_OPTIONS_SCHEMA, createAsyncAPIEmitterOptions, isAsyncAPIEmitterOptions,
} from "./utils.js"
export type {ServerConfig} from "./serverConfig.js"
export type {SecuritySchemeConfig} from "./securitySchemeConfig.js"
export type {OAuthFlowsConfig} from "./OAuthFlowsConfig.js"
export type {VariableConfig} from "./variableConfig.js"
export type {OAuthFlowConfig} from "./OAuthFlowConfig.js"
export type {VersioningConfig} from "./versioningConfig.js"
export type {AsyncAPIEmitterOptions} from "./asyncAPIEmitterOptions.js"