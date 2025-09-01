//TODO: Why is this not used anymore??
/**
 * Error thrown when emitter operations exceed time limits
 * Used for performance monitoring and timeout handling
 */
export class EmitterTimeoutError extends Error {
	readonly _tag = "EmitterTimeoutError"
	override readonly name = "EmitterTimeoutError"

	constructor(public readonly timeoutMs: number, public readonly operation: string) {
		super(`Operation '${operation}' timed out after ${timeoutMs}ms`)
	}
}