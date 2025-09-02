/**
 * Constants Index - Centralized Export
 * 
 * Single point of access for all constants used throughout the TypeSpec AsyncAPI Emitter.
 * This architecture eliminates hardcoded values and provides a centralized location for 
 * version management, path configuration, and default settings.
 */

// AsyncAPI Version Constants
export {
  ASYNCAPI_VERSIONS,
  ASYNCAPI_VERSION, // @deprecated - use ASYNCAPI_VERSIONS.CURRENT
  ASYNCAPI_VERSION_FIELD,
  ASYNCAPI_VERSION_OBJECT,
  ASYNCAPI_VERSION_DESCRIPTION,
  PACKAGE_VERSION
} from './asyncapi-constants.js'

// Path Constants
export {
  TEST_PATHS,
  EMITTER_PATHS,
  LIBRARY_PATHS,
  CONFIG_PATHS
} from './paths.js'

// Default Configuration Constants
export {
  DEFAULT_CONFIG,
  DEFAULT_EMITTER_OPTIONS,
  DEFAULT_SERVER_CONFIG,
  DEFAULT_MESSAGE_CONFIG,
  DEFAULT_VALIDATION_CONFIG,
  FILE_EXTENSIONS,
  DEFAULT_FILE_TYPES
} from './defaults.js'

// Protocol Constants (from existing files)
export type { AsyncAPIProtocolType } from './protocol-defaults.js'
export {
  SUPPORTED_PROTOCOLS,
  DEFAULT_PROTOCOL_PORTS,
  PROTOCOL_DEFAULTS,
  getDefaultProtocolPort
} from './protocol-defaults.js'

// Import for internal use in this file
import { ASYNCAPI_VERSIONS } from './asyncapi-constants.js'
import { DEFAULT_CONFIG } from './defaults.js'
import { EMITTER_PATHS, LIBRARY_PATHS } from './paths.js'
import { PACKAGE_VERSION } from './asyncapi-constants.js'

/**
 * Commonly used constant combinations for convenience
 */
export const COMMON_CONSTANTS = {
  /** Current AsyncAPI version */
  ASYNCAPI_VERSION: ASYNCAPI_VERSIONS.CURRENT,
  /** Default output configuration */
  DEFAULT_OUTPUT: {
    file: DEFAULT_CONFIG.OUTPUT_FILE,
    type: DEFAULT_CONFIG.FILE_TYPE,
    dir: EMITTER_PATHS.OUTPUT_DIR
  },
  /** Library identification */
  LIBRARY: {
    name: DEFAULT_CONFIG.LIBRARY_NAME,
    version: PACKAGE_VERSION,
    tspMain: LIBRARY_PATHS.MAIN_TSP
  }
} as const

// Re-export for backward compatibility
export const ASYNCAPI_VERSION_CURRENT = ASYNCAPI_VERSIONS.CURRENT
export const DEFAULT_OUTPUT_FILE = DEFAULT_CONFIG.OUTPUT_FILE
export const DEFAULT_FILE_TYPE = DEFAULT_CONFIG.FILE_TYPE
export const LIBRARY_NAME = DEFAULT_CONFIG.LIBRARY_NAME