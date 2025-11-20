/**
 * 🚨 ARCHITECTURAL VIOLATION: Duplicate configuration structure!
 * 
 * This file exists for test compatibility but creates SPLIT BRAIN:
 * - Configuration defined in multiple places (emitter.ts, options.ts, here)
 * - Tests expecting this file but main code using different structure
 * - No single source of truth for configuration
 * 
 * TODO: CONSOLIDATE all configuration into single module
 * TODO: ELIMINATE duplicate configuration definitions
 * TODO: IMPLEMENT proper configuration validation
 * TODO: USE TypeSpec's configuration system instead of custom
 */

import type { EmitFileOptions } from "@typespec/compiler";

/**
 * AsyncAPI Emitter Configuration Options
 * 
 * 🚨 LEGACY COMPATIBILITY: Structure exists for test compatibility
 * 
 * TODO: REFACTOR to use TypeSpec's native configuration system
 * TODO: REPLACE with proper schema validation
 * TODO: IMPLEMENT environment-based configuration override
 * TODO: ADD configuration migration system for breaking changes
 */
export type AsyncAPIEmitterOptions = EmitFileOptions & {
  /** Target AsyncAPI specification version */
  version: string;
  
  /** Generated document title */
  title?: string;
  
  /** Generated document description */
  description?: string;
  
  /** Output file name without extension */
  "output-file"?: string;
  
  /** Output file format (json, yaml) */
  "file-type"?: "json" | "yaml";
  
  /** Output directory for generated files */
  "output-dir"?: string;
  
  /** Whether to include debug information */
  debug?: boolean;
  
  /** Whether to validate generated AsyncAPI against schema */
  validate?: boolean;
  
  /** Whether to include source map information */
  "source-maps"?: boolean;
}

/**
 * 🚨 TYPE SAFETY VIOLATION: Creates representable invalid states!
 * 
 * This type allows impossible combinations:
 * - outputFile provided but fileType not provided
 * - Version provided but not valid AsyncAPI version
 * - Empty strings that should be non-optional
 * 
 * TODO: REPLACE with discriminated unions for type safety
 * TODO: IMPLEMENT exhaustive type checking
 * TODO: USE branded types for critical values
 * TODO: ADD runtime validation with @effect/schema
 */
export type AsyncAPIEmitterConfig = {
  version: string;
  title?: string;
  description?: string;
  outputFile?: string;
  fileType?: "json" | "yaml";
  outputDir?: string;
  debug?: boolean;
  validate?: boolean;
  sourceMaps?: boolean;
};

/**
 * Default emitter configuration
 * 
 * 🚨 ANTI-PATTERN: Hardcoded defaults create maintenance burden
 * 
 * TODO: LOAD defaults from configuration file
 * TODO: IMPLEMENT environment variable overrides
 * TODO: ADD configuration validation
 * TODO: USE factory pattern for configuration creation
 */
export const DEFAULT_ASYNCAPI_EMITTER_CONFIG: AsyncAPIEmitterConfig = {
  version: "3.0.0",
  title: "AsyncAPI Specification",
  description: "Generated AsyncAPI specification from TypeSpec",
  outputFile: "asyncapi",
  fileType: "yaml",
  outputDir: ".",
  debug: false,
  validate: true,
  sourceMaps: true,
} as const;

/**
 * 🚨 LEGACY COMPATIBILITY: Configuration schema for tests
 * 
 * TODO: INTEGRATE with TypeSpec's option system
 * TODO: REPLACE with proper JSON Schema
 * TODO: ADD validation for required vs optional fields
 * TODO: IMPLEMENT configuration migration
 */
export const ASYNC_API_EMITTER_OPTIONS_SCHEMA = {
  type: "object",
  properties: {
    version: {
      type: "string",
      description: "AsyncAPI specification version",
      default: "3.0.0",
    },
    title: {
      type: "string",
      description: "Generated document title",
    },
    description: {
      type: "string", 
      description: "Generated document description",
    },
    "output-file": {
      type: "string",
      description: "Output file name without extension",
      default: "asyncapi",
    },
    "file-type": {
      type: "string",
      enum: ["json", "yaml"],
      description: "Output file format",
      default: "yaml",
    },
  },
  required: ["version"],
} as const;

/**
 * 🚨 SPLIT BRAIN: Multiple configuration types create confusion
 * 
 * TODO: CONSOLIDATE into single configuration type
 * TODO: REMOVE duplicate interfaces
 * TODO: IMPLEMENT proper type conversion
 * TODO: ADD runtime type guards
 */
export type ConfigurationUnion = 
  | AsyncAPIEmitterOptions 
  | AsyncAPIEmitterConfig
  | Record<string, unknown>;

/**
 * Runtime configuration validator
 * 
 * 🚨 MISSING VALIDATION: No runtime checks for invalid configuration
 * 
 * TODO: IMPLEMENT comprehensive validation
 * TODO: ADD detailed error messages
 * TODO: USE Effect.TS for validation pipeline
 * TODO: PROVIDE configuration repair suggestions
 */
export const validateAsyncAPIConfig = (config: ConfigurationUnion): AsyncAPIEmitterConfig => {
  // TODO: Implement actual validation
  // TODO: Add version validation
  // TODO: Add file format validation
  // TODO: Add path validation
  // TODO: Add error recovery
  
  if (typeof config === "object" && config !== null) {
    return {
      ...DEFAULT_ASYNCAPI_EMITTER_CONFIG,
      ...config,
    };
  }
  
  return DEFAULT_ASYNCAPI_EMITTER_CONFIG;
};

/**
 * Legacy export for test compatibility
 * 
 * 🚨 DEPRECATED: Default exports hide module contents
 * 
 * TODO: REMOVE default export
 * TODO: CONVERT all imports to named exports
 * TODO: UPDATE test imports to be explicit
 */
export default DEFAULT_ASYNCAPI_EMITTER_CONFIG;