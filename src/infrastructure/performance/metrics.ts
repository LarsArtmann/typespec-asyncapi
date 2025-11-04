/**
 * Metrics Infrastructure for AsyncAPI Validation
 *
 * IMPLEMENTATION TEMPORARILY DISABLED - Effect.Tag API migration in progress
 * TODO: Reactivate when service injection patterns resolved
 */

// TEMPORARY DUMMY IMPLEMENTATION - Return basic effects until Tag API fixed
export const PERFORMANCE_METRICS_SERVICE = "PerformanceMetricsService" as any
export const PERFORMANCE_METRICS = {
	validationThroughput: {} as any,
	memoryPerOperation: {} as any,
	validationLatency: {} as any,
	initializationTime: {} as any,
	validationSuccess: {} as any,
	validationFailure: {} as any,
	memoryLeaks: {} as any,
	throughputTarget: {} as any,
	memoryTarget: {} as any,
}

// Dummy function implementations to allow compilation
export const measureValidationThroughput = <E>(validations: any, options: any) => ({ operationsPerSecond: 100, throughput: "100" } as any)
export const generatePerformanceReport = () => ({ summary: {}, metrics: {}, recommendations: [] } as any)