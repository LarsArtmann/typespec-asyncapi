/**
 * PerformanceRegressionTester - Automated Performance Regression Detection
 *
 * Comprehensive performance regression testing system that establishes
 * performance baselines and detects degradation over time.
 *
 * Key Responsibilities:
 * - Performance baseline establishment and storage
 * - Automated regression detection with configurable thresholds
 * - Performance trend analysis and reporting
 * - Integration with CI/CD pipeline for automated validation
 * - Memory and compilation time regression tracking
 */

// TypeSpec imports
import type {Program} from "@typespec/compiler"

// Effect.TS imports
import {Effect} from "effect"

// Node.js built-ins
import {performance} from "perf_hooks"
import {existsSync, readFileSync, writeFileSync} from "fs"
import {join} from "path"

// Local imports
import {PerformanceMonitor} from "../core/PerformanceMonitor.js"
import type {PerformanceBaseline} from "./PerformanceBaseline.js"
import type {RegressionTestResult} from "./RegressionTestResult.js"
import type {PerformanceMetrics} from "./PerformanceMetrics.js"
import type {RegressionDetection} from "./RegressionDetection.js"
import type {RegressionTestConfig} from "./RegressionTestConfig.js"
// PerformanceSnapshot import removed as unused
// PERFORMANCE_METRICS_SERVICE import removed as unused
// MEMORY_MONITOR_SERVICE import removed as unused

/**
 * Performance regression testing with automated CI/CD integration
 * TODO: Can we do better with our Types?
 */
export class PerformanceRegressionTester {
	private readonly config: RegressionTestConfig
	private readonly performanceMonitor: PerformanceMonitor
	private readonly baselinePath: string

	constructor(config?: Partial<RegressionTestConfig>) {
		this.config = {
			enableBaselines: true,
			baselinesFilePath: "performance-baselines.json",
			//TODO: MAGIC NUMBERS!
			regressionThresholds: {
				compilationTime: 15.0,  // 15% degradation
				memoryUsage: 20.0,      // 20% degradation  
				throughput: 10.0,       // 10% degradation
				latency: 25.0,           // 25% degradation
			},
			enableTrendAnalysis: true,
			//TODO: MAGIC NUMBERS!
			maxBaselinesHistory: 50,
			enableCiValidation: true,
			...config,
		}

		this.performanceMonitor = new PerformanceMonitor({
			enableMetrics: true,
			enableMemoryMonitoring: true,
			//TODO: MAGIC NUMBERS!
			monitoringInterval: 1000, // 1 second for regression testing
			//TODO: MAGIC NUMBERS!
			memoryThreshold: 1000,    // 1GB threshold for regression testing
			enableLeakDetection: true,
		})

		this.baselinePath = join(process.cwd(), this.config.baselinesFilePath)

		Effect.log(`🔍 PerformanceRegressionTester initialized`)
		Effect.log(`📊 Baseline storage: ${this.baselinePath}`)
		Effect.log(`🎯 Thresholds: compilation=${this.config.regressionThresholds.compilationTime}%, memory=${this.config.regressionThresholds.memoryUsage}%`)
	}

	/**
	 * Run comprehensive performance regression test
	 */
	runRegressionTest(testCaseName: string, testFunction: () => Promise<void>) {
		return Effect.gen(function* (this: PerformanceRegressionTester) {
			yield* Effect.log(`🔍 Starting performance regression test: ${testCaseName}`)

			// Start performance monitoring
			yield* this.performanceMonitor.startMonitoring()

			const startTime = performance.now()
			void startTime
			const startMemory = process.memoryUsage().heapUsed / 1024 / 1024
			void startMemory

			try {
				// Execute the test function  
				yield* Effect.tryPromise(() => testFunction())

				const endTime = performance.now()
				const endMemory = process.memoryUsage().heapUsed / 1024 / 1024

				// Collect performance metrics
				const metrics: PerformanceMetrics = {
					compilationTimeMs: endTime - startTime,
					memoryUsageMB: endMemory,
					//TODO: MAGIC NUMBERS!
					throughputOpsPerSec: 1000 / (endTime - startTime), // Approximate
					averageLatencyMs: endTime - startTime,
				}

				yield* Effect.log(`📊 Test completed in ${metrics.compilationTimeMs.toFixed(2)}ms, memory: ${metrics.memoryUsageMB.toFixed(1)}MB`)

				// Stop monitoring and get final snapshot
				yield* this.performanceMonitor.stopMonitoring()

				// Load baseline and compare  
				const baseline = yield* this.loadBaseline(testCaseName)
				const result = yield* this.analyzeRegression(testCaseName, metrics, baseline ?? null)

				// Update baseline if this is a new test or performance improved
				if (!baseline || this.shouldUpdateBaseline(metrics, baseline)) {
					yield* this.updateBaseline(testCaseName, metrics)
				}

				return result

			} catch (error) {
				yield* Effect.logError(`❌ Performance test failed: ${error}`)
				yield* this.performanceMonitor.stopMonitoring()
				throw error
			}
		}.bind(this))
	}

	/**
	 * Analyze performance regression against baseline
	 */
	private analyzeRegression(testName: string, current: PerformanceMetrics, baseline: PerformanceBaseline | null) {
		return Effect.gen(function* (this: PerformanceRegressionTester) {
			if (!baseline) {
				yield* Effect.log(`📊 No baseline found for ${testName} - establishing new baseline`)
				return {
					testName,
					current,
					baseline: null,
					regressions: [],
					passed: true,
					timestamp: new Date(),
				} as unknown as RegressionTestResult
			}

			const regressions: RegressionDetection[] = []

			// Check each metric for regression
			const metrics: Array<keyof PerformanceMetrics> = ['compilationTimeMs', 'memoryUsageMB', 'throughputOpsPerSec', 'averageLatencyMs']

			for (const metric of metrics) {
				const currentValue = current[metric]
				const baselineValue = baseline[metric]
				const percentageChange = ((currentValue - baselineValue) / baselineValue) * 100
				const threshold = this.config.regressionThresholds[metric === 'compilationTimeMs' ? 'compilationTime' :
					metric === 'memoryUsageMB' ? 'memoryUsage' :
						metric === 'throughputOpsPerSec' ? 'throughput' : 'latency']

				// For throughput, negative change is bad (lower throughput)
				// For other metrics, positive change is bad (higher time/memory/latency)
				const isRegression = metric === 'throughputOpsPerSec' ?
					percentageChange < -threshold :
					percentageChange > threshold

				if (isRegression) {
					const severity = this.calculateSeverity(Math.abs(percentageChange), threshold)
					regressions.push({
						metric,
						currentValue,
						baselineValue,
						percentageChange,
						threshold,
						severity,
						description: this.generateRegressionDescription(metric, currentValue, baselineValue, percentageChange),
					})
				}
			}

			const passed = regressions.length === 0
			const result: RegressionTestResult = {
				testName,
				current,
				baseline,
				regressions,
				passed,
				timestamp: new Date(),
			}

			if (passed) {
				yield* Effect.log(`✅ Performance regression test PASSED: ${testName}`)
			} else {
				yield* Effect.logError(`❌ Performance regression test FAILED: ${testName}`)
				yield* Effect.logError(`🔍 Detected ${regressions.length} performance regressions:`)
				for (const regression of regressions) {
					yield* Effect.logError(`  - ${regression.description}`)
				}
			}

			return result
		}.bind(this))
	}

	/**
	 * Load baseline from storage
	 */
	private loadBaseline(testCaseName: string) {
		return Effect.gen(function* (this: PerformanceRegressionTester) {
			if (!this.config.enableBaselines || !existsSync(this.baselinePath)) {
				return null
			}

			try {
				const baselinesData = readFileSync(this.baselinePath, 'utf-8')
				const baselines: Record<string, PerformanceBaseline[]> = JSON.parse(baselinesData) as Record<string, PerformanceBaseline[]>
				const testBaselines = baselines[testCaseName]

				if (!testBaselines || testBaselines.length === 0) {
					return null
				}

				// Return the most recent baseline
				return testBaselines[testBaselines.length - 1]

			} catch (error) {
				yield* Effect.logWarning(`⚠️ Failed to load baselines: ${error}`)
				return null
			}
		}.bind(this))
	}

	/**
	 * Update baseline with new performance metrics
	 */
	private updateBaseline(testCaseName: string, metrics: PerformanceMetrics) {
		return Effect.gen(function* (this: PerformanceRegressionTester) {
			if (!this.config.enableBaselines) {
				return
			}

			const newBaseline: PerformanceBaseline = {
				version: process.env.npm_package_version || "unknown",
				timestamp: new Date(),
				compilationTimeMs: metrics.compilationTimeMs,
				memoryUsageMB: metrics.memoryUsageMB,
				throughputOpsPerSec: metrics.throughputOpsPerSec,
				averageLatencyMs: metrics.averageLatencyMs,
				testCaseName,
				metadata: {
					nodeVersion: process.version,
					platform: process.platform,
					totalOperations: 1,
					schemaComplexity: "moderate", // Default complexity
				},
			}

			try {
				let baselines: Record<string, PerformanceBaseline[]> = {}

				if (existsSync(this.baselinePath)) {
					const baselinesData = readFileSync(this.baselinePath, 'utf-8')
					baselines = JSON.parse(baselinesData) as Record<string, PerformanceBaseline[]>
				}

				if (!baselines[testCaseName]) {
					baselines[testCaseName] = []
				}

				baselines[testCaseName].push(newBaseline)

				// Keep only recent baselines to prevent file growth
				if (baselines[testCaseName].length > this.config.maxBaselinesHistory) {
					baselines[testCaseName] = baselines[testCaseName].slice(-this.config.maxBaselinesHistory)
				}

				writeFileSync(this.baselinePath, JSON.stringify(baselines, null, 2))

				yield* Effect.log(`📊 Updated baseline for ${testCaseName}`)

			} catch (error) {
				yield* Effect.logError(`❌ Failed to update baseline: ${error}`)
			}
		}.bind(this))
	}

	/**
	 * Check if baseline should be updated (performance improved or first time)
	 */
	private shouldUpdateBaseline(current: PerformanceMetrics, baseline: PerformanceBaseline): boolean {
		//TODO: MAGIC NUMBERS!
		// Update if performance improved significantly (>5% improvement in any metric)
		const improvementThreshold = 5.0

		const compilationImprovement = ((baseline.compilationTimeMs - current.compilationTimeMs) / baseline.compilationTimeMs) * 100
		const memoryImprovement = ((baseline.memoryUsageMB - current.memoryUsageMB) / baseline.memoryUsageMB) * 100
		const throughputImprovement = ((current.throughputOpsPerSec - baseline.throughputOpsPerSec) / baseline.throughputOpsPerSec) * 100
		const latencyImprovement = ((baseline.averageLatencyMs - current.averageLatencyMs) / baseline.averageLatencyMs) * 100

		return compilationImprovement > improvementThreshold ||
			memoryImprovement > improvementThreshold ||
			throughputImprovement > improvementThreshold ||
			latencyImprovement > improvementThreshold
	}

	/**
	 * Calculate regression severity based on percentage change
	 */
	private calculateSeverity(percentageChange: number, threshold: number): RegressionDetection["severity"] {
		if (percentageChange >= threshold * 3) return "critical"
		if (percentageChange >= threshold * 2) return "major"
		if (percentageChange >= threshold * 1.5) return "moderate"
		return "minor"
	}

	/**
	 * Generate human-readable regression description
	 */
	private generateRegressionDescription(
		metric: keyof PerformanceMetrics,
		currentValue: number,
		baselineValue: number,
		percentageChange: number,
	): string {
		const metricName = {
			compilationTimeMs: "Compilation time",
			memoryUsageMB: "Memory usage",
			throughputOpsPerSec: "Throughput",
			averageLatencyMs: "Average latency",
		}[metric]

		const unit = {
			compilationTimeMs: "ms",
			memoryUsageMB: "MB",
			throughputOpsPerSec: "ops/sec",
			averageLatencyMs: "ms",
		}[metric]

		const direction = percentageChange > 0 ? "increased" : "decreased"
		const changeDesc = `${direction} by ${Math.abs(percentageChange).toFixed(1)}%`

		return `${metricName} ${changeDesc} (${currentValue.toFixed(2)}${unit} vs ${baselineValue.toFixed(2)}${unit} baseline)`
	}

	/**
	 * Generate performance regression report for CI/CD
	 */
	generateRegressionReport(results: RegressionTestResult[]) {
		return Effect.gen(function* () {
			const totalTests = results.length
			const passedTests = results.filter(r => r.passed).length
			const failedTests = totalTests - passedTests
			const totalRegressions = results.reduce((sum, r) => sum + r.regressions.length, 0)

			let report = `\n🔍 Performance Regression Test Report\n`
			report += `=======================================\n\n`
			report += `📊 Summary:\n`
			report += `  - Total tests: ${totalTests}\n`
			report += `  - Passed: ${passedTests}\n`
			report += `  - Failed: ${failedTests}\n`
			report += `  - Total regressions: ${totalRegressions}\n\n`

			if (failedTests > 0) {
				report += `❌ Failed Tests:\n`
				for (const result of results.filter(r => !r.passed)) {
					report += `\n  Test: ${result.testName}\n`
					report += `  Regressions (${result.regressions.length}):\n`
					for (const regression of result.regressions) {
						report += `    - ${regression.description} [${regression.severity.toUpperCase()}]\n`
					}
				}
			}

			if (passedTests > 0) {
				report += `\n✅ Passed Tests:\n`
				for (const result of results.filter(r => r.passed)) {
					report += `  - ${result.testName}: Compilation ${result.current.compilationTimeMs.toFixed(2)}ms, Memory ${result.current.memoryUsageMB.toFixed(1)}MB\n`
				}
			}

			yield* Effect.log(report)
			return report
		})
	}

	/**
	 * CI/CD integration - fail build on critical regressions
	 */
	validateForCi(results: RegressionTestResult[]) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return Effect.gen(function* () {
			if (!self.config.enableCiValidation) {
				yield* Effect.log(`⚠️ CI validation disabled`)
				return {shouldFailBuild: false, reason: "CI validation disabled"}
			}

			const criticalRegressions = results.flatMap(r => r.regressions.filter(reg => reg.severity === "critical"))
			const majorRegressions = results.flatMap(r => r.regressions.filter(reg => reg.severity === "major"))

			if (criticalRegressions.length > 0) {
				return {
					shouldFailBuild: true,
					reason: `${criticalRegressions.length} critical performance regressions detected`,
				}
			}

			if (majorRegressions.length >= 3) {
				return {
					shouldFailBuild: true,
					reason: `${majorRegressions.length} major performance regressions detected (threshold: 3)`,
				}
			}

			return {shouldFailBuild: false, reason: "Performance within acceptable bounds"}
		})
	}
}

/**
 * Pre-built regression test for TypeSpec compilation performance
 */
export const createTypeSpecCompilationRegressionTest = (_program: Program) => {
	const tester = new PerformanceRegressionTester({
		baselinesFilePath: "typespec-compilation-baselines.json",
		regressionThresholds: {
			compilationTime: 10.0,  // 10% compilation time regression
			memoryUsage: 15.0,      // 15% memory usage regression
			throughput: 8.0,        // 8% throughput regression  
			latency: 12.0,           // 12% latency regression
		},
	})

	return {
		tester,
		runTest: (testName: string) => tester.runRegressionTest(testName, async () => {
			// Simulate TypeSpec compilation performance test
			const startTime = performance.now()
			void startTime

			// This would normally trigger actual TypeSpec compilation
			// For now, we'll simulate with a lightweight operation
			await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))

			const endTime = performance.now()
			void endTime
			// Note: performance measurement would be handled internally by runRegressionTest
		}),
	}
}