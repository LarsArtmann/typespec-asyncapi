import type {StandardizedError} from "./StandardizedError.js"
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
	}
}