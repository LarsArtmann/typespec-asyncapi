import type {StandardizedError} from "./StandardizedError.js"
<<<<<<< HEAD
import {BaseError} from "./BaseError.js"
=======
>>>>>>> master

/**
 * Standardized error classes following Effect.TS patterns
 */
<<<<<<< HEAD
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
=======
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
>>>>>>> master
	}
}