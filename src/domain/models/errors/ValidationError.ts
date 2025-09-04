/**
 * Tagged error for validation failures
 */
export class ValidationError extends Error {
	readonly _tag = "ValidationError"
	override readonly name = "ValidationError"

	constructor(message: string, public readonly document: unknown) {
		super(message)
	}
}
