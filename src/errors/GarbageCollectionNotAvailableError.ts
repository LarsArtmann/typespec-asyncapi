import {GarbageCollectionFailureError} from "@/errors/GarbageCollectionFailureError.js"

export class GarbageCollectionNotAvailableError extends GarbageCollectionFailureError {
	readonly _tag = "GarbageCollectionNotAvailableError"
	override readonly name = "GarbageCollectionNotAvailableError"

	constructor(public readonly memoryBeforeGC: ByteAmount) {
		super(`Garbage collection was not available. Is your runtime NodeJS compliant? (memory before GC: ${memoryBeforeGC} bytes)`)
	}
}