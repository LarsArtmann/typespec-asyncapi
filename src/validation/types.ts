/**
 * Validation types and interfaces for AsyncAPI validation
 */

import type {ValidationError} from "@/errors/validation-error"

/**
 * Validation options for AsyncAPIValidator
 */
export type ValidationOptions = {
	strict?: boolean;
	enableCache?: boolean;
	benchmarking?: boolean;
	customRules?: unknown[];
}

/**
 * Validation statistics for reporting
 */
export type ValidationStats = {
	totalValidations: number;
	averageDuration: number;
	cacheHits: number;
}

/**
 * Validation diagnostic
 */
export type ValidationDiagnostic = {
	severity: "error" | "warning" | "info";
	message: string;
	path?: string;
}

/**
 * Validation result with diagnostics
 */
export type ValidationWithDiagnostics = {
	valid: boolean;
	diagnostics: ValidationDiagnostic[];
}

/**
 * Simplified validation result for legacy compatibility
 */
export type LegacyValidationResult = {
	valid: boolean;
	errors: ValidationError[];
	warnings: string[];
}

/**
 * Validation options for object validation
 */
export type ObjectValidationOptions = {
	strict?: boolean;
	enableCache?: boolean;
}
