/**
 * AsyncAPI Emitter Options - Main entry point
 *
 * This file provides a clean interface for AsyncAPI emitter options
 * by aggregating all functionality from the split modules.
 */

// Re-export types

// Re-export schemas
export {asyncAPIEmitterOptionsEffectSchema} from "./options/schemas.js"

// Re-export validation functions
export {parseAsyncAPIEmitterOptions, validateAsyncAPIEmitterOptions} from "./options/validation.js"

// Re-export utility functions and JSONSchema compatibility
export {
	ASYNC_API_EMITTER_OPTIONS_SCHEMA, createAsyncAPIEmitterOptions, isAsyncAPIEmitterOptions,
} from "./options/utils.js"
export type {ServerConfig} from "./options/serverConfig.js"
export type {SecuritySchemeConfig} from "./options/securitySchemeConfig.js"
export type {OAuthFlowsConfig} from "./options/OAuthFlowsConfig.js"
export type {VariableConfig} from "./options/variableConfig.js"
export type {OAuthFlowConfig} from "./options/OAuthFlowConfig.js"
export type {VersioningConfig} from "./options/versioningConfig.js"
export type {AsyncAPIEmitterOptions} from "./options/asyncAPIEmitterOptions.js"