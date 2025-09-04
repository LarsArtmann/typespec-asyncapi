import type {ErrorCategory} from "./ErrorCategory.js"

export type StandardizedError = {
	readonly category: ErrorCategory
	readonly code: string
	readonly message: string
	readonly details?: unknown
	readonly timestamp: Date
	readonly stack?: string
	readonly context?: Record<string, unknown>
	readonly recoverable: boolean
}