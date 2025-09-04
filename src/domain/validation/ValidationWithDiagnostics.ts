import type {ValidationDiagnostic} from "./ValidationDiagnostic.js"

/**
 * Validation result with diagnostics
 */
export type ValidationWithDiagnostics = {
	valid: boolean;
	diagnostics: ValidationDiagnostic[];
}
