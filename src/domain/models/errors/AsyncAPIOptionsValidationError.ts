/**
 * Error thrown when AsyncAPI emitter options validation fails
 * Tagged error for better error handling and recovery in Effect.TS
 */
export class AsyncAPIOptionsValidationError extends Error {
	readonly _tag = "AsyncAPIOptionsValidationError" as const
	override readonly name = "AsyncAPIOptionsValidationError"

	constructor(
		readonly field: string,
		readonly value: unknown,
		public override readonly message: string,
		override readonly cause?: Error,
	) {
		super(message)
		this.cause = cause
	}
}
