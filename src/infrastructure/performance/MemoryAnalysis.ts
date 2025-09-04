//TODO: Can we get a better return type, e.g a "Insufficient data for analysis" errors and co.?
export type MemoryAnalysis = {
	averageMemoryPerOperation: number;
	peakMemoryUsage: number;
	memoryGrowthRate: number; // bytes per second
	gcEfficiency: number; // percentage
	fragmentationRatio: number; // heap fragmentation
	leakSuspicionScore: number; // 0-1, higher = more suspicious
	recommendations: string[];
}