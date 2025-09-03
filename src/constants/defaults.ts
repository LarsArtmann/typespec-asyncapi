/**
 * Default Configuration Constants
 * 
 * Centralized default values for emitter configuration, file operations, and TypeSpec settings.
 * This replaces hardcoded configuration values throughout the codebase.
 */

/**
 * Default emitter configuration values
 */
export const DEFAULT_CONFIG = {
  /** Default output file name (without extension) */
  OUTPUT_FILE: 'asyncapi',
  /** Default file type for output */
  FILE_TYPE: 'yaml',
  /** Library name for TypeSpec */
  LIBRARY_NAME: '@lars-artmann/typespec-asyncapi'
} as const

/**
 * Default TypeSpec emitter options
 */
export const DEFAULT_EMITTER_OPTIONS = {
  /** Default output file name */
  'output-file': 'asyncapi',
  /** Default file type */
  'file-type': 'yaml'
} as const

/**
 * Default server configuration values
 */
export const DEFAULT_SERVER_CONFIG = {
  /** Default server name when none specified */
  NAME: 'default',
  /** Default host when none specified */
  HOST: 'localhost',
  /** Default protocol when none specified */
  PROTOCOL: 'http'
} as const

/**
 * Default message configuration values
 */
export const DEFAULT_MESSAGE_CONFIG = {
  /** Default content type for messages */
  CONTENT_TYPE: 'application/json',
  /** Default schema format */
  SCHEMA_FORMAT: 'application/vnd.aai.asyncapi+json;version=3.0.0'
} as const

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG = {
  /** Whether to validate AsyncAPI specs by default */
  VALIDATE_SPEC: true,
  /** Whether to fail on validation warnings */
  FAIL_ON_WARNINGS: false,
  /** Default validation timeout in milliseconds */
  TIMEOUT_MS: 5000
} as const

/**
 * File extension mappings
 */
export const FILE_EXTENSIONS = {
  /** YAML file extensions */
  YAML: ['.yaml', '.yml'],
  /** JSON file extensions */
  JSON: ['.json'],
  /** TypeScript file extensions */
  TYPESCRIPT: ['.ts', '.tsx'],
  /** TypeSpec file extensions */
  TYPESPEC: ['.tsp']
} as const

/**
 * Default file type mapping
 */
export const DEFAULT_FILE_TYPES = {
  yaml: 'yaml',
  json: 'json',
  yml: 'yaml'
} as const