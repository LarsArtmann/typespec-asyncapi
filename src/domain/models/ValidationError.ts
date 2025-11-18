import type { StandardizedError } from "./StandardizedError.js"
import {createStandardizedError} from "./ErrorBase.js"

/**
 * Standardized error classes following Effect.TS patterns
 */
export class ValidationError {
	readonly _tag = "ValidationError"
	constructor(
		readonly message: string,
		readonly details?: unknown,
		readonly context?: Record<string, unknown>
	) {
	}

	toStandardizedError(): StandardizedError {
		return createStandardizedError(
			"validation_error",
			"VALIDATION_FAILED",
			this.message,
			this.details as Record<string, unknown> || {},
			this.context,
			true
		)
	}
}