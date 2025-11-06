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
export type ValidationError = {
	message: string;
	keyword: string;
	instancePath: string;
	schemaPath: string;
} & BrandedValidationError

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
}

export type ValidationWarning = BrandedValidationWarning
