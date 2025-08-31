/**
 * AsyncAPI Validation Framework Index
 *
 * Exports all validation functionality for AsyncAPI 3.0 specifications
 */

export {
	// Core validator class
	AsyncAPIValidator,

	// Main validation functions
	validateAsyncAPIFile,
	validateAsyncAPIString,
	validateAsyncAPIObject,
	validateWithDiagnostics,
	validateAsyncAPIEffect,
	isValidAsyncAPI,
} from "./asyncapi-validator"

export type {
	// Types
	ValidationOptions,
	ValidationStats,
} from "./asyncapi-validator"

export type {
	ValidationResult,
	ValidationError,
} from "../errors/validation-error"