/**
 * Validation Type Definitions
 * 
 * Centralized type definitions for AsyncAPI validation.
 * Ensures type consistency across validation modules.
 */

/**
 * Validation error structure
 */
export interface ValidationError {
	message: string
	keyword: string
	instancePath: string
	schemaPath: string
}

/**
 * Validation statistics
 */
export interface ValidationStats {
	totalValidations: number
	averageDuration: number
	lastValidationAt?: Date
}

/**
 * Validation result structure
 */
export interface ValidationResult {
	valid: boolean
	errors: ValidationError[]
	warnings: string[]
	summary: string
	metrics: {
		duration: number
		channelCount: number
		operationCount: number
		schemaCount: number
		validatedAt: Date
	}
}

/**
 * Validation options
 */
export interface ValidationOptions {
	enablePerformanceOptimization?: boolean
	maxConcurrentValidations?: number
	enableDetailedLogging?: boolean
}

/**
 * AsyncAPI document basic structure
 */
export interface AsyncAPIDocument {
	asyncapi: string
	info: {
		title: string
		version: string
		[key: string]: any
	}
	[key: string]: any
}