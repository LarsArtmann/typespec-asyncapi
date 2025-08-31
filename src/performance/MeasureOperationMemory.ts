import type {ByteAmount} from "@/performance/ByteAmount.js"

export type MeasureOperationMemory<R> = {
	result: R;
	memoryUsed: ByteAmount
}