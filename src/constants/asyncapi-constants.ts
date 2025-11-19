/**
 * Version Constants - Complete Version Management
 *
 * Centralized version management for all hardcoded version strings.
 * Eliminates 50+ hardcoded version occurrences throughout codebase.
 *
 * USAGE:
 * - AsyncAPI specs: ASYNCAPI_VERSIONS.CURRENT
 * - Package versions: PACKAGE_VERSIONS.CURRENT
 * - API versions: API_VERSIONS.DEFAULT
 * - Testing: TEST_VERSIONS for all test fixtures
 */

/**
 * AsyncAPI specification versions
 */
export const ASYNCAPI_VERSIONS = {
  /** Current AsyncAPI version used by the emitter */
  CURRENT: "3.0.0" as const,
  /** All supported AsyncAPI versions */
  SUPPORTED: ["3.0.0"] as const,
  /** Default version when none specified */
  DEFAULT: "3.0.0" as const,
  /** Latest stable AsyncAPI version */
  LATEST_STABLE: "3.0.0" as const,
} as const;

/**
 * Package and library versions
 */
export const PACKAGE_VERSIONS = {
  /** Current emitter package version */
  CURRENT: "0.1.0-alpha" as const,
  /** Default API version for generated specs */
  DEFAULT_API: "1.0.0" as const,
  /** Release candidate version */
  RC: "1.0.0-rc.1" as const,
  /** Target production version */
  TARGET_PRODUCTION: "1.0.0" as const,
} as const;

/**
 * API and service versions used in examples and tests
 */
export const API_VERSIONS = {
  /** Default API version for examples */
  DEFAULT: "1.0.0" as const,
  /** Test API version */
  TEST: "1.0.0" as const,
  /** Demo API version */
  DEMO: "1.0.0" as const,
  /** Example API version */
  EXAMPLE: "1.0.0" as const,
} as const;

/**
 * Test fixture versions - used throughout test suites
 */
export const TEST_VERSIONS = {
  /** AsyncAPI version for test fixtures */
  ASYNCAPI: ASYNCAPI_VERSIONS.CURRENT,
  /** API version for test fixtures */
  API: API_VERSIONS.TEST,
  /** Service version for test fixtures */
  SERVICE: "1.0.0" as const,
  /** Plugin version for test fixtures */
  PLUGIN: "1.0.0" as const,
} as const;

/**
 * AsyncAPI document field name for the version specification
 */
export const ASYNCAPI_VERSION_FIELD = "asyncapi" as const;

/**
 * Complete AsyncAPI version object for document initialization
 */
export const ASYNCAPI_VERSION_OBJECT = {
  [ASYNCAPI_VERSION_FIELD]: ASYNCAPI_VERSIONS.CURRENT,
} as const;

/**
 * Human-readable descriptions
 */
export const VERSION_DESCRIPTIONS = {
  /** AsyncAPI version description */
  ASYNCAPI: `AsyncAPI ${ASYNCAPI_VERSIONS.CURRENT} specification`,
  /** Package version description */
  PACKAGE: `TypeSpec AsyncAPI Emitter v${PACKAGE_VERSIONS.CURRENT}`,
  /** API version description */
  API: `API version ${API_VERSIONS.DEFAULT}`,
} as const;

/**
 * Version validation patterns
 */
export const VERSION_PATTERNS = {
  /** Semantic version pattern */
  SEMVER: /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/,
  /** AsyncAPI version pattern */
  ASYNCAPI: /^3\.0\.0$/,
  /** Alpha/beta version pattern */
  PRERELEASE: /^\d+\.\d+\.\d+-[a-zA-Z]+$/,
} as const;
