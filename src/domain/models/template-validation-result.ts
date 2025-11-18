/**
 * Result of template variable validation using discriminated union
 *
 * ARCHITECTURE: Eliminates split brain pattern (isValid derived from errors.length).
 * Previous version had redundant isValid boolean that could become inconsistent.
 * Now uses explicit valid/invalid states with type-safe access to validation data.
 */
export type TemplateValidationResult =
	| {
		_tag: "valid"
		/** Successfully detected template variables */
		variables: string[]
		/** Variables that are not in the supported list (informational, not error) */
		unsupportedVariables: string[]
	}
	| {
		_tag: "invalid"
		/** Detected template variables */
		variables: string[]
		/** Unsupported variables causing validation failure */
		unsupportedVariables: string[]
		/** Validation errors describing why template is invalid */
		errors: string[]
	}

/**
 * Helper functions for working with TemplateValidationResult discriminated union
 */
export const templateValidationHelpers = {
	/**
	 * Check if template validation passed
	 */
	isValid: (result: TemplateValidationResult): result is Extract<TemplateValidationResult, { _tag: "valid" }> =>
		result._tag === "valid",

	/**
	 * Check if template validation failed
	 */
	isInvalid: (result: TemplateValidationResult): result is Extract<TemplateValidationResult, { _tag: "invalid" }> =>
		result._tag === "invalid",

	/**
	 * Get errors from result (empty array if valid)
	 */
	getErrors: (result: TemplateValidationResult): string[] =>
		result._tag === "invalid" ? result.errors : [],

	/**
	 * Get all detected variables
	 */
	getVariables: (result: TemplateValidationResult): string[] =>
		result.variables,

	/**
	 * Get unsupported variables
	 */
	getUnsupportedVariables: (result: TemplateValidationResult): string[] =>
		result.unsupportedVariables,
}