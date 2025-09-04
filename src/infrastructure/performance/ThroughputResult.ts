import type { ByteAmount } from "./ByteAmount.js";
import type { Milliseconds } from "./Durations.js";
import type { OperationsPerSecond, LatencyMicroseconds, MemoryEfficiencyRatio } from "./PerformanceTypes.js";

export type ThroughputResult = {
	operationsPerSecond: OperationsPerSecond;
	averageMemoryPerOperation: ByteAmount;
	averageLatencyMicroseconds: LatencyMicroseconds;
	totalDuration: Milliseconds;
	memoryEfficiency: MemoryEfficiencyRatio;
}