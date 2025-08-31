import type {ByteAmount} from "./ByteAmount.js"

export type MeasureOperationMemory<R> = {
	result: R;
	memoryUsed: ByteAmount
}