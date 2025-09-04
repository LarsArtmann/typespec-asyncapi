// MEMORY USAGE TRACKING
import type { ByteAmount } from "./ByteAmount.js";
import type { OperationCount } from "./PerformanceTypes.js";

type Timestamp = number & { readonly brand: 'Timestamp' };

export type MemorySnapshot = {
	timestamp: Timestamp;
	heapUsed: ByteAmount;
	heapTotal: ByteAmount;
	external: ByteAmount;
	arrayBuffers: ByteAmount;
	rss: ByteAmount;
	operationCount: OperationCount;
}

// Helper function to create timestamp safely
export const createTimestamp = (value: number): Timestamp => value as Timestamp;
