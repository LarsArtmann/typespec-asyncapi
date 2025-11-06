/**
 * Validation error types and utilities for AsyncAPI TypeSpec emitter
 *
 * This module contains all validation-related error definitions
 * following Railway Oriented Programming patterns with Effect.TS
 */


import type {ValidationError as BrandedValidationError, ValidationResult as BrandedValidationResult, ValidationWarning as BrandedValidationWarning} from "../../../types/index.js"

/**
 * 🔥 CRITICAL: AsyncAPI parser diagnostic type
 * DEPRECATED: Use BrandedValidationError from types/index.ts instead
 */

export type ValidationMetrics = {
	readonly duration: number;
	readonly channelCount: number;
	readonly operationCount: number;
	readonly schemaCount: number;
	readonly validatedAt: Date;
}

/**
 * 🔥 CRITICAL: Consolidated ValidationResult using discriminated union from types/index.ts
 */
export type ValidationResult<T = unknown> = BrandedValidationResult<T> & {
	readonly metrics: ValidationMetrics;
	readonly summary?: string;
}

// Legacy string-based error types for backward compatibility
export type ValidationError = string & { readonly brand: 'ValidationError' }
export type ValidationWarning = string & { readonly brand: 'ValidationWarning' }

/**
 * 🔥 CRITICAL: Structured error object for new validation (backward compatible)
 * Used by AsyncAPIValidator to provide detailed error information
 */
export type StructuredValidationError = {
	message: string;
	keyword: string;
	instancePath: string;
	schemaPath: string;
}

/**
 * 🔥 CRITICAL: Extended ValidationResult with structured errors and metrics
 * Used by AsyncAPIValidator for comprehensive validation reporting
 */
export type ExtendedValidationResult = ValidationResult & {
	readonly metrics: ValidationMetrics;
	readonly summary?: string;
	readonly errors?: StructuredValidationError[];
}
