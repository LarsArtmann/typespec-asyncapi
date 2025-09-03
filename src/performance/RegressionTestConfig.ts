//TODO: Can we do better with our Types?
export type RegressionTestConfig = {
	enableBaselines: boolean
	baselinesFilePath: string
	regressionThresholds: {
		compilationTime: number    // % degradation threshold
		memoryUsage: number       // % degradation threshold
		throughput: number        // % degradation threshold
		latency: number          // % degradation threshold
	}
	enableTrendAnalysis: boolean
	maxBaselinesHistory: number
	enableCiValidation: boolean
}