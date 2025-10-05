import type {StandardizedError} from "./StandardizedError.js"
import {BaseError} from "./BaseError.js"

/**
 * Standardized error classes following Effect.TS patterns
 */
export class ValidationError extends BaseError {
	readonly _tag = "ValidationError"
	constructor(
		message: string,
		readonly details?: unknown,
		context?: Record<string, unknown>
	) {
		super(message, context)
	}

	override toStandardizedError(): StandardizedError {
		return super.toStandardizedError("validation_error", "VALIDATION_FAILED", this.details, true)
	}
}