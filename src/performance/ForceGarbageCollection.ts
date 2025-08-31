import type {ByteAmount} from "@/performance/ByteAmount"

export type ForceGarbageCollection = {
	memoryFreed: ByteAmount;
	success: boolean
}