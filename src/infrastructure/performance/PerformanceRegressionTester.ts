/**
 * Performance Regression Testing Infrastructure
 * 
 * Comprehensive performance testing with automated regression detection.
 * Ensures code changes don't degrade performance below acceptable thresholds.
 */

import { Effect, gen } from "effect"
import { PerformanceMonitor } from "./PerformanceMonitor.js"

export type PerformanceConfig = {
	/** Maximum compilation time in milliseconds */
	maxCompilationTimeMs: number
	/** Maximum memory usage in megabytes */
	maxMemoryUsageMB: number
	/** Minimum throughput operations per second */
	minThroughputOpsPerSec: number
	/** Maximum latency in milliseconds */
	maxLatencyMs: number
	/** Enable/disable regression detection */
	enableRegressionDetection: boolean
	/** Baseline metrics for regression comparison */
	baseline?: PerformanceMetrics
}

export type PerformanceMetrics = {
	/** Total execution time in milliseconds */
	executionTimeMs: number
	/** Memory usage in megabytes */
	memoryUsageMB: number
	/** Operations per second throughput */
	throughputOpsPerSec: number
	/** Average latency in milliseconds */
	averageLatencyMs: number
	/** Peak memory usage in megabytes */
	peakMemoryUsageMB: number
	/** CPU usage percentage */
	cpuUsagePercent?: number
}

export type RegressionReport = {
	/** Performance regression detected */
	hasRegression: boolean
	/** Degraded metrics with percentage change */
	degradedMetrics: Array<{
		metric: keyof PerformanceMetrics
		currentValue: number
		baselineValue: number
		percentageChange: number
	}>
	/** Performance improvement detected */
	hasImprovement: boolean
	/** Improved metrics with percentage change */
	improvedMetrics: Array<{
		metric: keyof PerformanceMetrics
		currentValue: number
		baselineValue: number
		percentageChange: number
	}>
}

/**
 * Performance Regression Tester
 * 
 * Provides comprehensive performance testing with regression detection.
 * Validates against configurable thresholds and baseline comparisons.
 */
export class PerformanceRegressionTester {
	private readonly config: PerformanceConfig
	private readonly performanceMonitor: PerformanceMonitor

	constructor(config: PerformanceConfig) {
		this.config = config
		this.performanceMonitor = new PerformanceMonitor()
	}

	/**
	 * Run comprehensive performance test with regression detection
	 */
	runPerformanceTest = <A, E, R>(
		effect: Effect.Effect<A, E, R>,
		operationCount: number = 1
	): Effect.Effect<{
		metrics: PerformanceMetrics
		regressionReport: RegressionReport
		passedThresholds: boolean
	}, E | PerformanceTestError, R> =>
		Effect.gen(function* () {
			// Start performance monitoring
			const startResult = yield* this.performanceMonitor.startMonitoring()
			if (startResult.isFailed()) {
				return yield* Effect.fail(new PerformanceTestError(
					"Failed to start performance monitoring",
					startResult.error
				))
			}

			// Execute the effect with timing
			const startTime = performance.now()
			const result = yield* effect
			const endTime = performance.now()

			// Collect performance metrics
			const metricsResult = yield* this.performanceMonitor.collectMetrics()
			if (metricsResult.isFailed()) {
				return yield* Effect.fail(new PerformanceTestError(
					"Failed to collect performance metrics",
					metricsResult.error
				))
			}

			// Calculate performance metrics
			const executionTimeMs = endTime - startTime
			const metrics: PerformanceMetrics = {
				...metricsResult.value,
				executionTimeMs,
				throughputOpsPerSec: operationCount > 0 ? (operationCount / executionTimeMs) * 1000 : 0,
			}

			// Check threshold compliance
			const passedThresholds = this.checkThresholds(metrics)

			// Generate regression report if baseline available
			const regressionReport = this.config.baseline
				? this.generateRegressionReport(metrics, this.config.baseline)
				: {
					hasRegression: false,
					degradedMetrics: [],
					hasImprovement: false,
					improvedMetrics: [],
				}

			return {
				metrics,
				regressionReport,
				passedThresholds,
			}
		})

	/**
	 * Check if metrics meet configured thresholds
	 */
}

const checkThresholds = (metrics: PerformanceMetrics, config: PerformanceConfig): boolean => {
	return (
		metrics.executionTimeMs <= config.maxCompilationTimeMs &&
		metrics.memoryUsageMB <= config.maxMemoryUsageMB &&
		metrics.throughputOpsPerSec >= config.minThroughputOpsPerSec &&
		metrics.averageLatencyMs <= config.maxLatencyMs
	)
}

/**
 * Generate regression report comparing metrics to baseline
 */
const generateRegressionReport = (
	current: PerformanceMetrics,
	baseline: PerformanceMetrics
): RegressionReport => {
	const threshold = 0.1 // 10% degradation threshold
	const improvementThreshold = 0.05 // 5% improvement threshold

	const degradedMetrics: RegressionReport["degradedMetrics"] = []
	const improvedMetrics: RegressionReport["improvedMetrics"] = []

	const metricKeys: (keyof PerformanceMetrics)[] = [
		"executionTimeMs",
		"memoryUsageMB", 
		"throughputOpsPerSec",
		"averageLatencyMs",
		"peakMemoryUsageMB",
	]

	for (const metric of metricKeys) {
		const currentValue = current[metric] as number
		const baselineValue = baseline[metric] as number

		if (baselineValue === 0) continue

		const percentageChange = (currentValue - baselineValue) / baselineValue

		// For throughput, higher is better (inverted logic)
		const isInverseMetric = metric === "throughputOpsPerSec"
		const isDegradation = isInverseMetric 
			? percentageChange < -threshold 
			: percentageChange > threshold
		const isImprovement = isInverseMetric
			? percentageChange > improvementThreshold
			: percentageChange < -improvementThreshold

		if (isDegradation) {
			degradedMetrics.push({
				metric,
				currentValue,
				baselineValue,
				percentageChange: percentageChange * 100,
			})
		} else if (isImprovement) {
			improvedMetrics.push({
				metric,
				currentValue,
				baselineValue,
				percentageChange: percentageChange * 100,
			})
		}
	}

	return {
		hasRegression: degradedMetrics.length > 0,
		degradedMetrics,
		hasImprovement: improvedMetrics.length > 0,
		improvedMetrics,
	}
}

	/**
	 * Set baseline metrics for future regression comparisons
	 */
	setBaseline = (metrics: PerformanceMetrics): Effect.Effect<void, never, never> =>
		Effect.sync(() => {
			// In a real implementation, this would persist to storage
			// Effect.log("Performance baseline set:", metrics)
		})

	/**
	 * Create default configuration for development
	 */
	static createDevConfig(): PerformanceConfig {
		return {
			maxCompilationTimeMs: 10000,  // 10 seconds
			maxMemoryUsageMB: 200,        // 200MB
			minThroughputOpsPerSec: 5,    // 5 ops/sec
			maxLatencyMs: 2000,          // 2 seconds
			enableRegressionDetection: true,
		}
	}

	/**
	 * Create strict configuration for CI/CD
	 */
	static createCiConfig(): PerformanceConfig {
		return {
			maxCompilationTimeMs: 5000,   // 5 seconds
			maxMemoryUsageMB: 100,       // 100MB
			minThroughputOpsPerSec: 10,   // 10 ops/sec
			maxLatencyMs: 1000,          // 1 second
			enableRegressionDetection: true,
		}
	}
}

/**
 * Performance test error type
 */
export class PerformanceTestError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message)
		this.name = "PerformanceTestError"
	}
}

/**
 * Default performance configuration for the project
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
	maxCompilationTimeMs: 5000,
	maxMemoryUsageMB: 100,
	minThroughputOpsPerSec: 10,
	maxLatencyMs: 1000,
	enableRegressionDetection: true,
}