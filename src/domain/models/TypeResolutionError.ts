import type {StandardizedError} from "./StandardizedError.js"
<<<<<<< HEAD
import {BaseError} from "./BaseError.js"

export class TypeResolutionError extends BaseError {
	readonly _tag = "TypeResolutionError"

	constructor(
		message: string,
		readonly typeName?: string,
		context?: Record<string, unknown>,
	) {
		super(message, context)
	}

	override toStandardizedError(): StandardizedError {
		return super.toStandardizedError("type_error", "TYPE_RESOLUTION_FAILED", {typeName: this.typeName}, false)
=======

export class TypeResolutionError {
	readonly _tag = "TypeResolutionError"

	constructor(
		readonly message: string,
		readonly typeName?: string,
		readonly context?: Record<string, unknown>,
	) {
	}

	toStandardizedError(): StandardizedError {
		return {
			category: "type_error",
			code: "TYPE_RESOLUTION_FAILED",
			message: this.message,
			details: {typeName: this.typeName},
			timestamp: new Date(),
			...(this.context ? { context: this.context } : { context: {} }),
			recoverable: false,
		}
>>>>>>> master
	}
}