/**
 * Constants Index - Centralized Export
 *
 * Single point of access for all constants used throughout the TypeSpec AsyncAPI Emitter.
 * This architecture eliminates hardcoded values and provides a centralized location for
 * version management, path configuration, and default settings.
 */


//TODO: REMOVE RE_EXPORTS I HATE THEM!

// Version Constants (Enhanced)
export {
	PACKAGE_VERSIONS,
	API_VERSIONS,
	TEST_VERSIONS,
	VERSION_DESCRIPTIONS,
	VERSION_PATTERNS,
	ASYNCAPI_VERSION_FIELD,
	ASYNCAPI_VERSION_OBJECT,
} from './asyncapi-constants.js'

// Channel Template Constants
export {
	CHANNEL_TEMPLATES,
	ORDER_CHANNELS,
	SYSTEM_CHANNELS,
	TEST_CHANNELS,
	ECOMMERCE_CHANNELS,
	CHANNEL_PARAMETERS,
	CHANNEL_PATTERNS,
	CHANNEL_PREFIXES,
} from './channel-templates.js'

// Path Constants
export {
	TEST_PATHS,
	EMITTER_PATHS,
	LIBRARY_PATHS,
	CONFIG_PATHS,
} from './paths.js'

// Default Configuration Constants
export {
	DEFAULT_CONFIG,
	DEFAULT_EMITTER_OPTIONS,
	DEFAULT_SERVER_CONFIG,
	DEFAULT_MESSAGE_CONFIG,
	DEFAULT_VALIDATION_CONFIG,
	FILE_EXTENSIONS,
	DEFAULT_FILE_TYPES,
} from './defaults.js'

// Protocol Constants (from existing files)
export type {AsyncAPIProtocolType} from './protocol-defaults.js'
export {
	SUPPORTED_PROTOCOLS,
	DEFAULT_PROTOCOL_PORTS,
	PROTOCOL_DEFAULTS,
	getDefaultProtocolPort,
} from './protocol-defaults.js'


// Re-export NOT needed!