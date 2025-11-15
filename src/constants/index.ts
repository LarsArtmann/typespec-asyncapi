/**
 * Constants Index - Minimal Re-Exports
 *
 * PHILOSOPHY: Prefer direct imports from source files over re-exports.
 * Only essential exports needed by external consumers are re-exported here.
 *
 * For protocol constants, import directly from './protocol-defaults.js'
 */

// Version Constants (Enhanced)
export {
	ASYNCAPI_VERSIONS,
	TEST_VERSIONS,
} from './asyncapi-constants.js'

// Default Configuration Constants
export {
	DEFAULT_CONFIG,
} from './defaults.js'

// Protocol type export (implementation constants imported directly from protocol-defaults.ts)
export type {AsyncAPIProtocolType} from './protocol-defaults.js'