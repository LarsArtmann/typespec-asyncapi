import type {StandardizedError} from "./StandardizedError.js"

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
	}
}