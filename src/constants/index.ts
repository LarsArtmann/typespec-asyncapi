/**
 * Constants Index - Centralized Export
 *
 * Single point of access for all constants used throughout the TypeSpec AsyncAPI Emitter.
 * This architecture eliminates hardcoded values and provides a centralized location for
 * version management, path configuration, and default settings.
 */

//I STILL FUCKING HAT re-exports!!!!!!
//DISABLED!!!!

//TODO: REMOVE RE_EXPORTS I HATE THEM!

// Version Constants (Enhanced)
export {
	ASYNCAPI_VERSIONS,
	TEST_VERSIONS,
} from './asyncapi-constants.js'

// Default Configuration Constants
export {
	DEFAULT_CONFIG,
} from './defaults.js'
//
// Protocol Constants (from existing files)
export type {AsyncAPIProtocolType} from './protocol-defaults.js'
//export {
//	SUPPORTED_PROTOCOLS,
//	DEFAULT_PROTOCOL_PORTS,
//	PROTOCOL_DEFAULTS,
//	getDefaultProtocolPort,
//} from './protocol-defaults.js'


// Re-export NOT needed!