import type {GarbageCollectionNotAvailableError} from "../errors/GarbageCollectionNotAvailableError"
import type {ByteAmount} from "./ByteAmount"

export type ForceGCResult = {
	memoryBefore: ByteAmount;
	memoryAfter: ByteAmount
} | GarbageCollectionNotAvailableError