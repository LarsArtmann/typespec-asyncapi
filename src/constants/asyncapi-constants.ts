/**
 * AsyncAPI Version Constants
 * 
 * Centralized version management for AsyncAPI specifications.
 * This replaces hardcoded "3.0.0" strings throughout the codebase.
 */

/**
 * AsyncAPI version configuration
 */
export const ASYNCAPI_VERSIONS = {
  /** Current AsyncAPI version used by the emitter */
  CURRENT: '3.0.0',
  /** All supported AsyncAPI versions */
  SUPPORTED: ['3.0.0'],
  /** Default version when none specified */
  DEFAULT: '3.0.0'
} as const

/**
 * AsyncAPI specification version supported by this emitter
 * @deprecated Use ASYNCAPI_VERSIONS.CURRENT instead
 */
export const ASYNCAPI_VERSION = ASYNCAPI_VERSIONS.CURRENT

/**
 * AsyncAPI document field name for the version specification
 */
export const ASYNCAPI_VERSION_FIELD = "asyncapi" as const

/**
 * Complete AsyncAPI version object for document initialization
 */
export const ASYNCAPI_VERSION_OBJECT = {
	[ASYNCAPI_VERSION_FIELD]: ASYNCAPI_VERSIONS.CURRENT
} as const

/**
 * Human-readable description of the AsyncAPI version used
 */
export const ASYNCAPI_VERSION_DESCRIPTION = `AsyncAPI ${ASYNCAPI_VERSIONS.CURRENT} specification`

/**
 * Package version from package.json
 */
export const PACKAGE_VERSION = '0.1.0-alpha' as const