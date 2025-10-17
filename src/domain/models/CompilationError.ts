import type {StandardizedError} from "./StandardizedError.js"
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
	}
}