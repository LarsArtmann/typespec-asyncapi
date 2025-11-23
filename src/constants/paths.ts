/**
 * Simple Paths
 * 
 * MINIMAL WORKING VERSION: Basic path management without complex branding
 * Focus on getting compilation working first
 */

import { join, resolve, dirname, basename, extname, isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Current working directory
 */
export const CURRENT_WORKING_DIR = process.cwd();

/**
 * Project root directory (automatically detected)
 */
export const PROJECT_ROOT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);

/**
 * Core path directories
 */
export const PATHS = {
  // Project structure
  PROJECT_ROOT: PROJECT_ROOT_DIR,
  SRC_DIR: join(PROJECT_ROOT_DIR, "src"),
  DIST_DIR: join(PROJECT_ROOT_DIR, "dist"),
  TEST_DIR: join(PROJECT_ROOT_DIR, "test"),
  DOCS_DIR: join(PROJECT_ROOT_DIR, "docs"),
  REPORTS_DIR: join(PROJECT_ROOT_DIR, "reports"),
  
  // Source subdirectories
  TYPES_DIR: join(PROJECT_ROOT_DIR, "src", "types"),
  UTILS_DIR: join(PROJECT_ROOT_DIR, "src", "utils"),
  CONSTANTS_DIR: join(PROJECT_ROOT_DIR, "src", "constants"),
  DOMAIN_DIR: join(PROJECT_ROOT_DIR, "src", "domain"),
  INFRASTRUCTURE_DIR: join(PROJECT_ROOT_DIR, "src", "infrastructure"),
  
  // Default paths
  DEFAULT_OUTPUT_DIR: PROJECT_ROOT_DIR,
  DEFAULT_OUTPUT_FILE: "asyncapi.yaml",
  DEFAULT_LOG_FILE: join(PROJECT_ROOT_DIR, "typespec-asyncapi.log"),
  DEFAULT_CONFIG_FILE: join(PROJECT_ROOT_DIR, "asyncapi.config.js"),
};

/**
 * File extension constants
 */
export const FILE_EXTENSIONS = {
  TYPESCRIPT: ".ts",
  JAVASCRIPT: ".js",
  YAML: ".yaml",
  YML: ".yml",
  JSON: ".json",
  MD: ".md",
  SPEC: ".tsp",
};

/**
 * File name patterns
 */
export const FILE_PATTERNS = {
  ASYNCAPI_FILE: /^asyncapi\.(yaml|yml|json)$/i,
  TYPESPEC_FILE: /^.+\.(tsp|spec)$/i,
  DECORATOR_FILE: /^.+-decorators\.(ts|js)$/i,
  DOMAIN_TYPE_FILE: /^.+-domain-types\.(ts|js)$/i,
  UTILITY_FILE: /^.+(utils|helpers)\.(ts|js)$/i,
};

/**
 * Path validation utilities
 */
export const pathValidation = {
  /**
   * Check if path is absolute
   */
  isAbsolute: (path: string): boolean => isAbsolute(path),

  /**
   * Check if path is relative
   */
  isRelative: (path: string): boolean => !isAbsolute(path),

  /**
   * Check if path has valid file extension
   */
  hasValidExtension: (path: string, extensions: readonly string[]): boolean =>
    extensions.some(ext => path.toLowerCase().endsWith(ext.toLowerCase())),

  /**
   * Check if path matches a pattern
   */
  matchesPattern: (path: string, pattern: RegExp): boolean =>
    pattern.test(basename(path)),
};

/**
 * Path transformation utilities
 */
export const pathTransformation = {
  /**
   * Convert to absolute path
   */
  toAbsolute: (path: string, base: string = CURRENT_WORKING_DIR): string =>
    resolve(base, path),

  /**
   * Convert to relative path
   */
  toRelative: (path: string, base: string = CURRENT_WORKING_DIR): string =>
    relative(base, path),

  /**
   * Normalize path separators
   */
  normalize: (path: string): string =>
    resolve(path).replace(/\\/g, "/"),

  /**
   * Join path segments safely
   */
  join: (...segments: string[]): string => join(...segments),

  /**
   * Get file extension
   */
  getExtension: (path: string): string => extname(path),

  /**
   * Get file name without extension
   */
  getBaseName: (path: string): string => basename(path, extname(path)),

  /**
   * Get directory name
   */
  getDirName: (path: string): string => dirname(path),
};

/**
 * Path utility exports
 */
export const pathUtils = {
  ...PATHS,
  ...FILE_EXTENSIONS,
  ...FILE_PATTERNS,
  validation: pathValidation,
  transformation: pathTransformation,
};