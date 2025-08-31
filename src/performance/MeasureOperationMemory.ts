import type {ByteAmount} from "./ByteAmount"

export type MeasureOperationMemory<R> = {
	result: R;
	memoryUsed: ByteAmount
}