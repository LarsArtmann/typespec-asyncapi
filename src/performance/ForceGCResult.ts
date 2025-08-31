import type {GarbageCollectionNotAvailableError} from "@/errors/GarbageCollectionNotAvailableError.js"

export type ForceGCResult = {
	memoryBefore: ByteAmount;
	memoryAfter: ByteAmount
} | GarbageCollectionNotAvailableError