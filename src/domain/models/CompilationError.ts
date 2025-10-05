import type {StandardizedError} from "./StandardizedError.js"
import {BaseError} from "./BaseError.js"

export class CompilationError extends BaseError {
	readonly _tag = "CompilationError"

	constructor(
		message: string,
		readonly filePath?: string,
		readonly lineNumber?: number,
		context?: Record<string, unknown>,
	) {
		super(message, context)
	}

	override toStandardizedError(): StandardizedError {
		return super.toStandardizedError("compilation_error", "COMPILATION_FAILED", {filePath: this.filePath, lineNumber: this.lineNumber}, false)
	}
}