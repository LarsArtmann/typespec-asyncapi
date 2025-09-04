import {GarbageCollectionFailureError} from "./GarbageCollectionFailureError.js"
import type {ByteAmount} from "../performance/ByteAmount.js"

export class GarbageCollectionNotAvailableError extends GarbageCollectionFailureError {
	override readonly _tag: string = "GarbageCollectionNotAvailableError"
	override readonly name: string = "GarbageCollectionNotAvailableError"

	constructor(memoryBeforeGC: ByteAmount) {
		super(`Garbage collection was not available. Is your runtime NodeJS compliant?`, memoryBeforeGC)
	}
}