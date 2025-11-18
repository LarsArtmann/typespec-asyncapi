/**
 * Shared protocol validation utilities
 * Extracted from duplicated validation logic in bindings and protocol files
 */

/**
 * Protocol validation result using discriminated union
 *
 * ARCHITECTURE: Eliminates split brain pattern (isValid derived from errors.length).
 * Previous version had redundant isValid boolean that could become inconsistent.
 *
 * Note: This is different from ValidationResult in src/errors/validation-error.ts
 * which is for AsyncAPI document validation with comprehensive metrics.
 * This type is for simple protocol binding validation with basic error/warning lists.
 */
export type ProtocolValidationResult =
	| {
		_tag: "valid"
		/** Validation passed, possibly with warnings */
		warnings: string[]
	}
	| {
		_tag: "invalid"
		/** Validation failed with errors */
		errors: string[]
		/** Additional warnings alongside errors */
		warnings: string[]
	}

/**
 * Validate basic string field requirements
 * Centralized string validation logic
 */
export function validateRequiredString(value: string | undefined, fieldName: string): string[] {
	const errors: string[] = []

	if (!value || value.trim() === '') {
		errors.push(`${fieldName} is required`)
	}

	return errors
}

/**
 * Validate positive integer field
 * Centralized integer validation logic
 *
 * Returns discriminated union for type-safe error handling.
 */
export function validatePositiveInteger(value: number | undefined, fieldName: string, maxValue?: number): ProtocolValidationResult {
	const errors: string[] = []
	const warnings: string[] = []

	if (value !== undefined) {
		if (!Number.isInteger(value) || value < 1) {
			errors.push(`${fieldName} must be a positive integer`)
		} else if (maxValue && value > maxValue) {
			warnings.push(`High ${fieldName.toLowerCase()} value may impact performance`)
		}
	}

	return errors.length === 0
		? { _tag: "valid", warnings }
		: { _tag: "invalid", errors, warnings }
}

/**
 * Validate string pattern matching
 * Centralized pattern validation logic
 */
export function validateStringPattern(value: string | undefined, fieldName: string, pattern: RegExp, description: string): string[] {
	const errors: string[] = []

	if (value !== undefined && value.trim() !== '' && !pattern.test(value)) {
		errors.push(`${fieldName} ${description}`)
	}

	return errors
}

/**
 * Validate string length constraints
 * Centralized length validation logic
 */
export function validateStringLength(value: string | undefined, fieldName: string, maxLength: number): string[] {
	const errors: string[] = []

	if (value !== undefined && value.length > maxLength) {
		errors.push(`${fieldName} cannot exceed ${maxLength} characters`)
	}

	return errors
}

/**
 * Validate enum values
 * Centralized enum validation logic
 */
export function validateEnumValue<T extends string>(value: T | undefined, fieldName: string, allowedValues: readonly T[]): string[] {
	const errors: string[] = []

	if (value !== undefined && !allowedValues.includes(value)) {
		errors.push(`${fieldName} must be one of: ${allowedValues.join(", ")}`)
	}

	return errors
}

/**
 * Validate HTTP status code range
 * Centralized status code validation logic
 */
export function validateHttpStatusCode(statusCode: number | undefined, fieldName: string): string[] {
	const errors: string[] = []

	if (statusCode !== undefined && (statusCode < 100 || statusCode > 599)) {
		errors.push(`${fieldName} must be a valid HTTP status code (100-599)`)
	}

	return errors
}

/**
 * Combine multiple validation results
 * Utility to merge validation results into single discriminated union
 *
 * Aggregates all errors and warnings from multiple results.
 */
export function combineValidationResults(...results: ProtocolValidationResult[]): ProtocolValidationResult {
	const allErrors: string[] = []
	const allWarnings: string[] = []

	for (const result of results) {
		if (result._tag === "invalid") {
			allErrors.push(...result.errors)
		}
		allWarnings.push(...result.warnings)
	}

	return allErrors.length === 0
		? { _tag: "valid", warnings: allWarnings }
		: { _tag: "invalid", errors: allErrors, warnings: allWarnings }
}

/**
 * Helper functions for working with ProtocolValidationResult discriminated union
 */
export const protocolValidationHelpers = {
	/**
	 * Check if validation passed
	 */
	isValid: (result: ProtocolValidationResult): result is Extract<ProtocolValidationResult, { _tag: "valid" }> =>
		result._tag === "valid",

	/**
	 * Check if validation failed
	 */
	isInvalid: (result: ProtocolValidationResult): result is Extract<ProtocolValidationResult, { _tag: "invalid" }> =>
		result._tag === "invalid",

	/**
	 * Get errors from result (empty array if valid)
	 */
	getErrors: (result: ProtocolValidationResult): string[] =>
		result._tag === "invalid" ? result.errors : [],

	/**
	 * Get warnings from result
	 */
	getWarnings: (result: ProtocolValidationResult): string[] =>
		result.warnings,
}
