import type {ByteAmount} from "./ByteAmount.js"

export type ForceGarbageCollection = {
	memoryFreed: ByteAmount;
	success: boolean
}