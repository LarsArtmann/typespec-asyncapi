import type {ByteAmount} from "@/performance/ByteAmount.js"

export type ForceGarbageCollection = {
	memoryFreed: ByteAmount;
	success: boolean
}