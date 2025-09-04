/**
 * Error thrown when AsyncAPI emitter options cannot be parsed
 * Tagged error for Effect.TS error handling
 */
export class AsyncAPIOptionsParseError extends Error {
	readonly _tag = "AsyncAPIOptionsParseError" as const
	override readonly name = "AsyncAPIOptionsParseError"

	constructor(
		public override readonly message: string,
		override readonly cause?: Error,
	) {
		super(message)
		this.cause = cause
	}
}