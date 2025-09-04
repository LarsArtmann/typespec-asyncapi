import type {GarbageCollectionNotAvailableError} from "../../domain/models/errors/GarbageCollectionNotAvailableError.js"
import type {ByteAmount} from "./ByteAmount.js"

export type ForceGCResult = {
	memoryBefore: ByteAmount;
	memoryAfter: ByteAmount
} | GarbageCollectionNotAvailableError