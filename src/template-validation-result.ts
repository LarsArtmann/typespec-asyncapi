/**
 * Result of template variable validation
 */
export type TemplateValidationResult = {
	isValid: boolean;
	variables: string[];
	unsupportedVariables: string[];
	errors: string[];
}