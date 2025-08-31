import type {ByteAmount} from "@/performance/ByteAmount"

export type MeasureOperationMemory<R> = {
	result: R;
	memoryUsed: ByteAmount
}