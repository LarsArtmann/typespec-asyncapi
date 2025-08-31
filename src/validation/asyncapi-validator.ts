/**
 * AsyncAPI Validation Module - Main entry point
 *
 * This file provides backward compatibility exports and aggregates all validation functionality.
 */

// Re-export the main validator class
export {AsyncAPIValidator} from "./validator-core"

// Re-export types
export type {ValidationOptions, ValidationStats} from "./types"

// Re-export legacy functions for backward compatibility
export {validateAsyncAPIFile, validateAsyncAPIString} from "./legacy-functions"

// Re-export utility functions
export {validateAsyncAPIEffect, validateWithDiagnostics, isValidAsyncAPI, validateAsyncAPIObject} from "./validator-utils"
