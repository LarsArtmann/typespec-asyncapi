import type {AsyncAPIEmitterOptions} from "../options.js"

/**
 * Error thrown when specification generation fails
 * Contains the options that were used during generation attempt
 */
export class SpecGenerationError extends Error {
	readonly _tag = "SpecGenerationError"
	override readonly name = "SpecGenerationError"

	constructor(message: string, public readonly options: AsyncAPIEmitterOptions) {
		super(message)
	}
}
