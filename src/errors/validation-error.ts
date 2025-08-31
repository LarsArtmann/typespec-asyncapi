/**
 * Validation error types and utilities for AsyncAPI TypeSpec emitter
 *
 * This module contains all validation-related error definitions
 * following Railway Oriented Programming patterns with Effect.TS
 */


/**
 * Validation error type based on AsyncAPI parser diagnostics
 */
export type ValidationError = {
	message: string;
	keyword: string;
	instancePath: string;
	schemaPath: string;
}

export type ValidationMetrics = {
	duration: number;
	channelCount: number;
	operationCount: number;
	schemaCount: number;
	validatedAt: Date;
}

/**
 * Validation result type with comprehensive metrics and diagnostics
 */
export type ValidationResult = {
	valid: boolean;
	errors: ValidationError[];
	warnings: string[];
	summary: string;
	metrics: ValidationMetrics;
}
