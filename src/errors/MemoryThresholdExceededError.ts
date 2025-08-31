import type {ByteAmount} from "../performance/ByteAmount.js"

export class MemoryThresholdExceededError extends Error {
	readonly _tag = "MemoryThresholdExceededError"
	override readonly name = "MemoryThresholdExceededError"

	constructor(
		public readonly currentUsage: ByteAmount,
		public readonly threshold: number,
		public readonly operationType: string = "unknown",
	) {
		super(`Memory threshold exceeded for ${operationType}: ${currentUsage} bytes > ${threshold} bytes`)
	}
}