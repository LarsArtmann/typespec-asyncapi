//TODO: replace nothing saying numbers with named types!
export type ThroughputResult = {
	operationsPerSecond: number;
	averageMemoryPerOperation: number;
	averageLatencyMicroseconds: number;
	totalDuration: number;
	memoryEfficiency: number;
}