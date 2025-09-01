/**
 * AsyncAPI Constants
 * 
 * Centralized constants for AsyncAPI specification values to ensure consistency
 * and make version updates easier to manage across the entire emitter.
 */

/**
 * AsyncAPI specification version supported by this emitter
 */
export const ASYNCAPI_VERSION = "3.0.0" as const

/**
 * AsyncAPI document field name for the version specification
 */
export const ASYNCAPI_VERSION_FIELD = "asyncapi" as const

/**
 * Complete AsyncAPI version object for document initialization
 */
export const ASYNCAPI_VERSION_OBJECT = {
	[ASYNCAPI_VERSION_FIELD]: ASYNCAPI_VERSION
} as const

/**
 * Human-readable description of the AsyncAPI version used
 */
export const ASYNCAPI_VERSION_DESCRIPTION = `AsyncAPI ${ASYNCAPI_VERSION} specification`