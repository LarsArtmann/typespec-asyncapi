// PERFORMANCE MEASUREMENT CONTEXT
export type PerformanceMeasurement = {
	startTime: number;
	memoryBefore: NodeJS.MemoryUsage;
	operationCount: number;
	operationType: string;
}
