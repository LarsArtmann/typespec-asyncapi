import type {StandardizedError} from "./StandardizedError.js"
<<<<<<< HEAD
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
=======

export class CompilationError {
	readonly _tag = "CompilationError"

	constructor(
		readonly message: string,
		readonly filePath?: string,
		readonly lineNumber?: number,
		readonly context?: Record<string, unknown>,
	) {
	}

	toStandardizedError(): StandardizedError {
		return {
			category: "compilation_error",
			code: "COMPILATION_FAILED",
			message: this.message,
			details: {filePath: this.filePath, lineNumber: this.lineNumber},
			timestamp: new Date(),
			...(this.context ? { context: this.context } : { context: {} }),
			recoverable: false,
		}
>>>>>>> master
	}
}