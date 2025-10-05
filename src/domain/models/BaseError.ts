import type {StandardizedError} from "./StandardizedError.js"
import type {ErrorCategory} from "./ErrorCategory.js"

/**
 * Base error class with shared toStandardizedError logic
 * Eliminates duplication across TypeResolutionError, ValidationError, CompilationError
 */
export abstract class BaseError {
	abstract readonly _tag: string
	abstract readonly message: string
	readonly context?: Record<string, unknown>

	constructor(message: string, context?: Record<string, unknown>) {
		this.message = message
		this.context = context
	}

	/**
	 * Convert to standardized error format
	 * Shared implementation extracted from all error classes
	 */
	toStandardizedError(category: ErrorCategory, code: string, details?: unknown, recoverable: boolean = false): StandardizedError {
		return {
			category,
			code,
			message: this.message,
			details,
			timestamp: new Date(),
			...(this.context ? { context: this.context } : { context: {} }),
			recoverable,
		}
	}
}
