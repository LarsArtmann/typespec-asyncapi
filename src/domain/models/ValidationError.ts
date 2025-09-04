import type {StandardizedError} from "./StandardizedError.js"

/**
 * Standardized error classes following Effect.TS patterns
 */
export class ValidationError {
	readonly _tag = "ValidationError"
	constructor(
		readonly message: string,
		readonly details?: unknown,
		readonly context?: Record<string, unknown>
	) {}

	toStandardizedError(): StandardizedError {
		return {
			category: "validation_error",
			code: "VALIDATION_FAILED",
			message: this.message,
			details: this.details,
			timestamp: new Date(),
			...(this.context ? { context: this.context } : { context: {} }),
			recoverable: true
		}
	}
}