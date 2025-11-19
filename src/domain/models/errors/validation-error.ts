/**
 * Validation error types and utilities for AsyncAPI TypeSpec emitter
 *
 * This module contains all validation-related error definitions
 * following Railway Oriented Programming patterns with Effect.TS
 *
 * DEPRECATED: Use types from src/types/index.ts instead
 * This file is kept for backward compatibility only
 */

// Re-export everything from types/index.ts for convenience
export type {
  ValidationError,
  ValidationResult,
  ValidationWarning,
  ExtendedValidationResult,
  ValidationMetrics,
} from "../../../types/index.js";
