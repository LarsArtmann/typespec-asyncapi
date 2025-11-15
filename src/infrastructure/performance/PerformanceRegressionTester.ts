/**
 * Performance Regression Testing Infrastructure
 * 
 * Comprehensive performance testing with automated regression detection.
 * Ensures code changes don't degrade performance below acceptable thresholds.
 */

import { Effect } from "effect"
import { PerformanceMonitor } from "./PerformanceMonitor.js"
import { PERFORMANCE_MONITORING } from "../../constants/defaults.js"

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
 * Performance Regression Tester
 * 
 * Provides comprehensive performance testing with automated regression detection.
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
		Effect.gen(function* (this: PerformanceRegressionTester) {
			// Start performance monitoring
			yield* this.performanceMonitor.startMonitoring()

			// Execute the effect with timing
			const startTime = performance.now()
			const _result = yield* effect
			const endTime = performance.now()

			// Collect performance metrics
			const baseMetrics = yield* this.performanceMonitor.collectMetrics()

			// Calculate derived metrics
			const executionTimeMs = endTime - startTime
			const metrics: PerformanceMetrics = {
				...baseMetrics,
				executionTimeMs,
				throughputOpsPerSec: operationCount > 0 ? (operationCount / executionTimeMs) * 1000 : 0,
			}

			// Check threshold compliance
			const passedThresholds = this.checkThresholds(metrics, this.config)

			// Generate regression report if baseline available
			const regressionReport = this.generateRegressionReport(metrics, this.config.baseline)

			return {
				metrics,
				regressionReport,
				passedThresholds,
			}
		})

	/**
	 * Check if metrics meet configured thresholds
	 */
	private readonly checkThresholds = (metrics: PerformanceMetrics, config: PerformanceConfig): boolean => {
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
	private readonly generateRegressionReport = (
		current: PerformanceMetrics,
		baseline?: PerformanceMetrics
	): RegressionReport => {
		if (!baseline) {
			return {
				hasRegression: false,
				degradedMetrics: [],
				hasImprovement: false,
				improvedMetrics: [],
			}
		}

		const threshold = PERFORMANCE_MONITORING.DEGRADATION_THRESHOLD // 10% degradation threshold
		const improvementThreshold = PERFORMANCE_MONITORING.IMPROVEMENT_THRESHOLD // 5% improvement threshold

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
					percentageChange: percentageChange * PERFORMANCE_MONITORING.PERCENTAGE_MULTIPLIER,
				})
			} else if (isImprovement) {
				improvedMetrics.push({
					metric,
					currentValue,
					baselineValue,
					percentageChange: percentageChange * PERFORMANCE_MONITORING.PERCENTAGE_MULTIPLIER,
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
	setBaseline = (_metrics: PerformanceMetrics): Effect.Effect<void, never, never> =>
		Effect.sync(() => {
			// In a real implementation, this would persist to storage
			// Effect.log("Performance baseline set:", _metrics)
		})

	/**
	 * Create default configuration for development
	 */
	static createDevConfig(): PerformanceConfig {
		return {
			maxCompilationTimeMs: PERFORMANCE_MONITORING.DEV_MAX_COMPILATION_TIME_MS,  // 10 seconds
			maxMemoryUsageMB: PERFORMANCE_MONITORING.DEV_MAX_MEMORY_USAGE_MB,        // 200MB
			minThroughputOpsPerSec: PERFORMANCE_MONITORING.DEV_MIN_THROUGHPUT_OPS_PER_SEC,    // 5 ops/sec
			maxLatencyMs: PERFORMANCE_MONITORING.DEV_MAX_LATENCY_MS,          // 2 seconds
			enableRegressionDetection: true,
		};
	}

	/**
	 * Create strict configuration for CI/CD
	 */
	static createCiConfig(): PerformanceConfig {
		return {
			maxCompilationTimeMs: PERFORMANCE_MONITORING.CI_MAX_COMPILATION_TIME_MS,   // 5 seconds
			maxMemoryUsageMB: PERFORMANCE_MONITORING.CI_MAX_MEMORY_USAGE_MB,       // 100MB
			minThroughputOpsPerSec: PERFORMANCE_MONITORING.CI_MIN_THROUGHPUT_OPS_PER_SEC,   // 10 ops/sec
			maxLatencyMs: PERFORMANCE_MONITORING.CI_MAX_LATENCY_MS,          // 1 second
			enableRegressionDetection: true,
		};
	}
}

/**
 * Default performance configuration for development
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = PerformanceRegressionTester.createDevConfig()