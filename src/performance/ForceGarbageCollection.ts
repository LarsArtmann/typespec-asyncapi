import type {ByteAmount} from "./ByteAmount"

export type ForceGarbageCollection = {
	memoryFreed: ByteAmount;
	success: boolean
}