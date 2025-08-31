import type {ByteAmount} from "../performance/ByteAmount"

export class GarbageCollectionFailureError extends Error {
	readonly _tag: string = "GarbageCollectionFailureError"
	override readonly name: string = "GarbageCollectionFailureError"

	constructor(public override readonly message: string, public readonly memoryBeforeGC: ByteAmount) {
		super(`Garbage collection failed: ${message} (memory before GC: ${memoryBeforeGC} bytes)`)
	}
}