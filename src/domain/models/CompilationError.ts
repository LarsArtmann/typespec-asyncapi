import type {StandardizedError} from "./StandardizedError.js"
import {createStandardizedError} from "./ErrorBase.js"

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
		return createStandardizedError(
			"compilation_error",
			"COMPILATION_FAILED",
			this.message,
			{filePath: this.filePath, lineNumber: this.lineNumber},
			this.context,
			false
		)
	}
}