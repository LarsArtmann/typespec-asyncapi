export class GarbageCollectionFailureError extends Error {
	readonly _tag = "GarbageCollectionFailureError"
	override readonly name = "GarbageCollectionFailureError"

	constructor(public override readonly message: string, public readonly memoryBeforeGC: ByteAmount) {
		super(`Garbage collection failed: ${message} (memory before GC: ${memoryBeforeGC} bytes)`)
	}
}