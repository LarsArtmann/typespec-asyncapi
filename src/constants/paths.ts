/**
 * Path Constants
 *
 * Centralized path management for file operations, testing, and output directories.
 * This replaces hardcoded paths throughout the codebase.
 */

/**
 * Test-related paths used across the test suite
 */
export const TEST_PATHS = {
  /** Base output directory for test files */
  OUTPUT: "test-output",
  /** Integration test output directory */
  INTEGRATION: "test-output/integration-basic",
  /** Test fixtures and helper files directory */
  FIXTURES: "test/documentation/helpers",
  /** Temporary test output directory */
  TEMP: "test-output/temp",
} as const;

/**
 * TypeSpec emitter output paths
 */
export const EMITTER_PATHS = {
  /** Default TypeSpec output directory for this emitter */
  OUTPUT_DIR: "tsp-output/@lars-artmann/typespec-asyncapi",
  /** Temporary directory for emitter operations */
  TEMP_DIR: "temp",
  /** Base tsp-output directory */
  TSP_OUTPUT: "tsp-output",
} as const;

/**
 * Library and package-related paths
 */
export const LIBRARY_PATHS = {
  /** Main TypeSpec library file */
  MAIN_TSP: "lib/main.tsp",
  /** Source directory */
  SRC: "src",
  /** Distribution directory */
  DIST: "dist",
  /** Library directory */
  LIB: "lib",
} as const;

/**
 * Configuration file paths
 */
export const CONFIG_PATHS = {
  /** TypeScript configuration */
  TSCONFIG: "tsconfig.json",
  /** Package.json file */
  PACKAGE_JSON: "package.json",
  /** ESLint configuration */
  ESLINT_CONFIG: "eslint.config.js",
} as const;
