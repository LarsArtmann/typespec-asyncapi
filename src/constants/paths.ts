/**
 * 🚨 ARCHITECTURAL VIOLATION: This file shouldn't exist!
 * 
 * Tests were importing from non-existent file, creating split brain
 * between test expectations and actual implementation.
 * 
 * TODO: REFACTOR TESTS to remove hardcoded path expectations
 * TODO: CONSOLIDATE PATH MANAGEMENT into single source of truth
 * TODO: ELIMINATE MAGIC PATHS throughout codebase
 */

/**
 * Legacy path constants for test infrastructure compatibility
 * 
 * 🚨 DEPRECATED: These will be removed in favor of proper path resolution
 * 
 * TODO: Replace with proper TypeSpec library discovery mechanisms
 * TODO: Use compiler-provided paths instead of hardcoded strings
 * TODO: Migrate to environment-aware path resolution
 */
export const LIBRARY_PATHS = {
  /** Legacy path for TypeSpec library discovery */
  TYPESPEC_ASYNCAPI: "@lars-artmann/typespec-asyncapi",
  
  /** Legacy paths for test infrastructure */
  TEST_FIXTURES: "test/utils/fixtures",
  TEST_TEMP_OUTPUT: "test/temp-output",
  TEST_OUTPUTS: "test-output",
  
  /** Legacy paths for source structure */
  SOURCE_DIR: "src",
  DIST_DIR: "dist",
  LIB_DIR: "lib",
  
  /** Legacy paths for TypeSpec integration */
  TYPESPEC_MAIN: "lib/main.tsp",
  TYPESPEC_OUTPUT: "tsp-output",
  
  /** Legacy paths for AsyncAPI generation */
  ASYNCAPI_OUTPUT: "asyncapi.yaml",
  ASYNCAPI_JSON: "asyncapi.json",
} as const;

/**
 * Legacy path type definitions
 * 
 * TODO: Replace with proper path types from @typespec/compiler
 * TODO: Use branded types for path safety
 * TODO: Implement path validation for type safety
 */
export type LibraryPathKey = typeof LIBRARY_PATHS[keyof typeof LIBRARY_PATHS];

/**
 * Legacy path resolution utilities
 * 
 * 🚨 ANTI-PATTERN: String-based path resolution is error-prone
 * 
 * TODO: Replace with proper path.join() utilities
 * TODO: Use path.resolve() for absolute paths
 * TODO: Add path existence validation
 * TODO: Implement cross-platform path handling
 */
export const getPath = (_key: LibraryPathKey): string => {
  // TODO: Add path validation
  // TODO: Add cross-platform handling
  // TODO: Add error handling for invalid keys
  return LIBRARY_PATHS[_key as keyof typeof LIBRARY_PATHS];
};

/**
 * Check if legacy path exists
 * 
 * TODO: Implement proper file system validation
 * TODO: Add async path checking
 * TODO: Use fs.promises instead of sync operations
 * TODO: Add proper error handling
 */
export const pathExists = (_key: LibraryPathKey): boolean => {
  // TODO: Implement actual path checking
  // TODO: Use fs.promises.access()
  // TODO: Handle cross-platform differences
  return false; // Placeholder - never returns true
};

/**
 * Default export for legacy compatibility
 * 
 * 🚨 VIOLATION: Default exports hide explicit dependencies
 * 
 * TODO: Convert to named exports only
 * TODO: Update all imports to be explicit
 * TODO: Remove default export pattern
 */
export default LIBRARY_PATHS;