/**
 * VERSION MANAGEMENT SYSTEM
 * 
 * Comprehensive semantic versioning and version management
 * Eliminates "split brain" issues and provides single source of truth
 */

/**
 * Current AsyncAPI version with semantic versioning
 */
export const CURRENT_ASYNCAPI_VERSION = "3.0.0" as const;

/**
 * Supported AsyncAPI versions
 */
export const SUPPORTED_ASYNCAPI_VERSIONS = ["3.0.0"] as const;

/**
 * Latest stable AsyncAPI version
 */
export const LATEST_ASYNCAPI_VERSION = "3.0.0" as const;

/**
 * Version compatibility matrix
 */
export const ASYNCAPI_COMPATIBILITY = {
  MIN: "3.0.0" as const,
  MAX: "3.0.0" as const,
  RANGE: ">=3.0.0 <=3.0.0" as const,
} as const;

/**
 * Library version with semantic versioning
 */
export const LIBRARY_VERSION = "1.0.0" as const;

/**
 * Build information
 */
export const BUILD_INFO = {
  VERSION: LIBRARY_VERSION,
  BUILD_DATE: new Date().toISOString(),
  GIT_COMMIT: process.env.GIT_COMMIT ?? "unknown",
  NODE_VERSION: process.version,
  TYPESPEC_VERSION: "0.55.0" as const,
} as const;

/**
 * Complete version information
 */
export const VERSION_INFO = {
  asyncapi: CURRENT_ASYNCAPI_VERSION,
  library: LIBRARY_VERSION,
  supported: SUPPORTED_ASYNCAPI_VERSIONS,
  latest: LATEST_ASYNCAPI_VERSION,
  compatibility: ASYNCAPI_COMPATIBILITY,
  build: BUILD_INFO,
} as const;

/**
 * Version validation utilities
 */
export const versionUtils = {
  /**
   * Check if AsyncAPI version is supported
   */
  isAsyncAPISupported: (version: string): boolean => 
    SUPPORTED_ASYNCAPI_VERSIONS.includes(version as typeof SUPPORTED_ASYNCAPI_VERSIONS[number]),

  /**
   * Check if version is in compatibility range
   */
  isCompatibleVersion: (version: string): boolean => 
    version >= ASYNCAPI_COMPATIBILITY.MIN && version <= ASYNCAPI_COMPATIBILITY.MAX,

  /**
   * Parse semantic version
   */
  parseVersion: (version: string) => {
    const [major, minor = "0", patch = "0"] = version.split('.');
    return { major, minor, patch };
  },

  /**
   * Compare semantic versions
   */
  compareVersions: (a: string, b: string): number => {
    const aVer = versionUtils.parseVersion(a);
    const bVer = versionUtils.parseVersion(b);
    
    const compare = (part: keyof typeof aVer) => 
      parseInt(aVer[part]) - parseInt(bVer[part]);
    
    return compare('major') || compare('minor') || compare('patch');
  },

  /**
   * Get version compatibility info
   */
  getCompatibilityInfo: () => VERSION_INFO,
} as const;

/**
 * Type definitions for version management
 */
export type AsyncAPIVersion = typeof SUPPORTED_ASYNCAPI_VERSIONS[number];
export type SemanticVersion = `${string}.${string}.${string}`;
export type CompatibilityRange = typeof ASYNCAPI_COMPATIBILITY.RANGE;