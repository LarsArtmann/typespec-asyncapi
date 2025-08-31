//TODO: Can we get better stricter/types???
// MEMORY USAGE TRACKING
export type MemorySnapshot = {
	timestamp: number;
	heapUsed: number;
	heapTotal: number;
	external: number;
	arrayBuffers: number;
	rss: number;
	operationCount: number;
}
