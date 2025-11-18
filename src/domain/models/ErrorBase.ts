import type { StandardizedError } from "./StandardizedError.js"

/**
 * Shared utilities for error model standardization
 * Eliminates duplication across CompilationError, ValidationError, TypeResolutionError
 */

/**
 * Creates a standardized error with common patterns
 */
export const createStandardizedError = (
	category: StandardizedError["category"],
	code: string,
	message: string,
	details: Record<string, unknown> = {},
	context?: Record<string, unknown>,
	recoverable: boolean = false
): StandardizedError => ({
	category,
	code,
	message,
	details,
	timestamp: new Date(),
	context: context ?? {},
	recoverable
})

/**
 * Merges optional context with defaults consistently
 */
export const mergeContext = (
	userContext?: Record<string, unknown>
): Record<string, unknown> => userContext ?? {}

/**
 * Creates consistent error details object
 */
export const createErrorDetails = (
	...fields: (string | undefined)[]
): Record<string, unknown> => {
	const details: Record<string, unknown> = 
	fields.filter((field): field is string => field !== undefined)
		.reduce((acc, field, index) => {
			const fieldName = [`detail${index}`, `field${index}`].find(name => !acc[name])
			if (fieldName) {
				acc[fieldName] = field
			}
			return acc
		}, {} as Record<string, unknown>)
	
	return details
}