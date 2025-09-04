//TODO: Can we do better with our Types?
export type PerformanceBaseline = {
	version: string
	timestamp: Date
	compilationTimeMs: number
	memoryUsageMB: number
	throughputOpsPerSec: number
	averageLatencyMs: number
	testCaseName: string
	metadata: {
		nodeVersion: string
		platform: string
		totalOperations: number
		schemaComplexity: "simple" | "moderate" | "complex" | "enterprise"
	}
}