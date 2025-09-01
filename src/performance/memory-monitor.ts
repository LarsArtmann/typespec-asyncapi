/**
 * Advanced Memory Usage Monitoring System
 *
 * Implements precise memory tracking for AsyncAPI validation operations
 * with <1KB per operation target and leak detection using Railway Programming.
 */

//TODO: This file is getting too big and should be split into multiple smaller files.

import {Context, Duration, Effect, Fiber, Layer, Ref} from "effect"
import {MemoryThresholdExceededError} from "../errors/MemoryThresholdExceededError.js"
import {MemoryMonitorInitializationError} from "../errors/MemoryMonitorInitializationError.js"
import {MemoryLeakDetectedError} from "../errors/MemoryLeakDetectedError.js"
import {GarbageCollectionFailureError} from "../errors/GarbageCollectionFailureError.js"
import {GarbageCollectionNotAvailableError} from "../errors/GarbageCollectionNotAvailableError.js"
import type {MemoryMonitorService} from "./MemoryMonitorService.js"
import type {MemoryBudget} from "./MemoryBudget.js"
import type {MemorySnapshot} from "./MemorySnapshot.js"
import type {MemoryAnalysis} from "./MemoryAnalysis.js"
import type {ForceGCResult} from "./ForceGCResult.js"

/**
 * @deprecated: Each Error should have it s own file in src/errors;
 *   This will be deleted when unused.
 */
export {MemoryMonitorInitializationError, MemoryLeakDetectedError, GarbageCollectionFailureError}


export const DEFAULT_MEMORY_BUDGET: MemoryBudget = {
	maxMemoryPerOperation: 300 * 1024 * 1024, // 300MB per operation (realistic for complex AsyncAPI generation)
	maxTotalMemory: 1024 * 1024 * 1024, // 1GB total (increased for production workloads)
	maxGrowthRate: 10 * 1024 * 1024, // 10MB per second (reasonable for intensive processing)
	alertThreshold: 80, // 80%
	forceGCThreshold: 90, // 90%
}


export const MEMORY_MONITOR_SERVICE = Context.GenericTag<MemoryMonitorService>("MemoryMonitorService")

// MEMORY MONITOR IMPLEMENTATION
const makeMemoryMonitorService = Effect.gen(function* () {
	// Internal state
	const snapshots = yield* Ref.make<MemorySnapshot[]>([])
	const budget = yield* Ref.make<MemoryBudget>(DEFAULT_MEMORY_BUDGET)
	const monitoringFiber = yield* Ref.make<Fiber.Fiber<void> | null>(null)
	const operationCounts = yield* Ref.make<Map<string, number>>(new Map())

	//TODO: ALL THESE 'functions' below should be REAL functions and extracted outside the makeMemoryMonitorService

	// Helper to create default memory analysis with custom recommendation
	const createDefaultMemoryAnalysis = (recommendation: string): MemoryAnalysis => ({
		averageMemoryPerOperation: 0,
		peakMemoryUsage: 0,
		memoryGrowthRate: 0,
		gcEfficiency: 0,
		fragmentationRatio: 0,
		leakSuspicionScore: 0,
		recommendations: [recommendation],
	})

	// Helper to get snapshots and analyze memory usage
	const getSnapshotsAndAnalyze = (windowMs?: number): Effect.Effect<MemoryAnalysis, never> =>
		Effect.gen(function* () {
			const allSnapshots = yield* Ref.get(snapshots)
			//TODO: Handle the new Effect return type properly!
			return yield* analyzeMemoryUsage(allSnapshots, windowMs)
		})

	// Helper to get current memory usage
	const getCurrentMemoryUsage = (): NodeJS.MemoryUsage => {
		if (!(typeof process !== "undefined" && process.memoryUsage)) {
			//TODO: Just have a branded ERROR HERE!!!
			// Fallback for non-Node environments
			return {
				rss: 0,
				heapUsed: 0,
				heapTotal: 0,
				external: 0,
				arrayBuffers: 0,
			}
		}
		return process.memoryUsage()
	}

	// Helper to force garbage collection if available
	const tryForceGC = (): Effect.Effect<ForceGCResult, GarbageCollectionFailureError> => {
		const memoryBefore = getCurrentMemoryUsage().heapUsed

		try {
			//TODO: use Effect.try() if possible

			if (typeof global !== "undefined" && global.gc) {
				global.gc()
				const memoryAfter = getCurrentMemoryUsage().heapUsed
				return Effect.succeed({memoryBefore, memoryAfter})
			} else {
				return Effect.fail(new GarbageCollectionNotAvailableError(memoryBefore))
			}
		} catch {
			// Use Effect.logDebug instead of console.debug for consistency
			return Effect.fail(new GarbageCollectionNotAvailableError(memoryBefore))
			// GC not available or failed

			//TODO: can we do better here??
			// return Effect.fail(new GarbageCollectionFailureError("unknown", memoryBefore)) // Unreachable - commented out
		}
	}

	const takeSnapshot = (operationCount = 0): Effect.Effect<MemorySnapshot, never> =>
		Effect.gen(function* () {
			const memory = getCurrentMemoryUsage()
			const snapshot: MemorySnapshot = {
				timestamp: performance.now(),
				heapUsed: memory.heapUsed,
				heapTotal: memory.heapTotal,
				external: memory.external,
				arrayBuffers: memory.arrayBuffers || 0,
				rss: memory.rss,
				operationCount,
			}

			// Update snapshots (keep last 1000 snapshots)
			yield* Ref.update(snapshots, current => {
				const updated = [...current, snapshot]
				return updated.length > 1000 ? updated.slice(-1000) : updated
			})

			return snapshot
		})

	const startMonitoring = (intervalMs = 1000): Effect.Effect<void, MemoryMonitorInitializationError> =>
		Effect.gen(function* () {
			// Stop existing monitoring if running
			const existing = yield* Ref.get(monitoringFiber)
			if (existing) {
				yield* Fiber.interrupt(existing)
			}

			const monitoringEffect = Effect.gen(function* () {
				yield* Effect.forever(
					Effect.gen(function* () {
						// Take periodic snapshots
						yield* takeSnapshot()

						// Check budget compliance
						const {compliant, violations} = yield* checkBudgetCompliance()
						if (!compliant && violations.length > 0) {
							yield* Effect.logWarning("Memory budget violations detected", {
								violations: violations.join(", "),
							})

							// Attempt optimization if violations are severe
							const currentBudget = yield* Ref.get(budget)
							const currentSnapshot = yield* takeSnapshot()
							const utilizationPct = (currentSnapshot.heapUsed / currentBudget.maxTotalMemory) * 100

							if (utilizationPct >= currentBudget.forceGCThreshold) {
								yield* Effect.logInfo("Triggering garbage collection due to high memory usage")
								yield* forceGarbageCollection().pipe(Effect.ignore)
							}
						}

						// Check for memory leaks periodically
						if (Math.random() < 0.1) { // 10% chance to check for leaks
							yield* detectMemoryLeaks(30000).pipe( // Check 30-second window
								Effect.either,
								Effect.map(result => {
									if (result._tag === "Left") {
										return Effect.logError("Memory leak detected", {
											leakRate: `${result.left.leakRate} bytes/sec`,
											threshold: `${result.left.thresholdRate} bytes/sec`,
											duration: `${result.left.duration}s`,
										})
									}
									return Effect.void
								}),
								Effect.flatten,
							)
						}

						yield* Effect.sleep(Duration.millis(intervalMs))
					}),
				)
			})

			const fiber = yield* Effect.fork(monitoringEffect)
			yield* Ref.set(monitoringFiber, fiber)

			yield* Effect.logInfo("Memory monitoring started", {
				intervalMs,
				budget: yield* Ref.get(budget),
			})
		}).pipe(
			Effect.catchAll(error =>
				Effect.fail(new MemoryMonitorInitializationError(
					`Failed to start memory monitoring: ${error}`,
					error,
				)),
			),
		)

	const stopMonitoring = (): Effect.Effect<void, never> =>
		Effect.gen(function* () {
			const fiber = yield* Ref.get(monitoringFiber)
			if (fiber) {
				yield* Fiber.interrupt(fiber)
				yield* Ref.set(monitoringFiber, null)
				yield* Effect.logInfo("Memory monitoring stopped")
			}
		})

	const measureOperationMemory: <T, E extends Error>(operation: Effect.Effect<T, MemoryThresholdExceededError | E>, operationType: string) => Effect.Effect<{
		result: T;
		memoryUsed: number
	}, MemoryThresholdExceededError | E> = <T, E extends Error>(
		operation: Effect.Effect<T, MemoryThresholdExceededError | E>,
		operationType: string,
	): Effect.Effect<{ result: T; memoryUsed: number }, MemoryThresholdExceededError | E> =>
		Effect.gen(function* () {
			const beforeSnapshot = yield* takeSnapshot()

			// Execute the operation
			const result = yield* operation

			const afterSnapshot = yield* takeSnapshot()
			const memoryUsed = Math.max(0, afterSnapshot.heapUsed - beforeSnapshot.heapUsed)

			// Update operation counts
			yield* Ref.update(operationCounts, counts => {
				const current = counts.get(operationType) || 0
				return new Map(counts).set(operationType, current + 1)
			})

			// Check against budget
			const currentBudget = yield* Ref.get(budget)
			if (memoryUsed > currentBudget.maxMemoryPerOperation) {
				return yield* Effect.fail(new MemoryThresholdExceededError(
					memoryUsed,
					currentBudget.maxMemoryPerOperation,
					operationType,
				))
			}

			yield* Effect.logDebug("Operation memory measured", {
				operationType,
				memoryUsed: `${memoryUsed} bytes`,
				withinBudget: memoryUsed <= currentBudget.maxMemoryPerOperation,
			})

			return {result, memoryUsed}
		})

	const analyzeMemoryUsage = (
		snapshotWindow: MemorySnapshot[],
		windowMs = 60000,
	): Effect.Effect<MemoryAnalysis, never> =>
		Effect.gen(function* () {
			if (snapshotWindow.length < 2) {
				//TODO: Can we get a better return type, e.g a "Insufficient data for analysis" error?
				return createDefaultMemoryAnalysis("Insufficient data for analysis")
			}

			const now = performance.now()
			const windowStart = now - windowMs
			const relevantSnapshots = snapshotWindow.filter(s => s.timestamp >= windowStart)

			if (relevantSnapshots.length < 2) {
				//TODO: Can we get a better return type, e.g a "Window too narrow for analysis" error?
				return createDefaultMemoryAnalysis("Window too narrow for analysis")
			}

			const first = relevantSnapshots[0]
			const last = relevantSnapshots[relevantSnapshots.length - 1]
			if (!first || !last) {
				//TODO: Can we get a better return type, e.g a "Insufficient data for analysis" error?
				return createDefaultMemoryAnalysis("Insufficient snapshot data for analysis")
			}
			const duration = (last.timestamp - first.timestamp) / 1000 // seconds

			// Calculate metrics
			const totalOperations = last.operationCount - first.operationCount
			const memoryGrowth = last.heapUsed - first.heapUsed
			const peakMemoryUsage = Math.max(...relevantSnapshots.map(s => s.heapUsed))

			const averageMemoryPerOperation = totalOperations > 0 ? memoryGrowth / totalOperations : 0
			const memoryGrowthRate = duration > 0 ? memoryGrowth / duration : 0

			// Calculate GC efficiency (looking for memory drops)
			const gcEvents = []
			for (let i = 1; i < relevantSnapshots.length; i++) {
				//TODO: Can this be undefined and crash?
				const prev = relevantSnapshots[i - 1]
				//TODO: Can this be undefined and crash?
				const curr = relevantSnapshots[i]
				//TODO: @typescript-eslint/no-non-null-assertion
				const memoryDrop = prev.heapUsed - curr.heapUsed
				if (memoryDrop > 1024 * 1024) { // Significant drop > 1MB
					gcEvents.push(memoryDrop)
				}
			}
			const gcEfficiency = gcEvents.length > 0 ? gcEvents.reduce((a, b) => a + b, 0) / memoryGrowth : 0

			// Calculate fragmentation ratio
			const avgHeapUsed = relevantSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / relevantSnapshots.length
			const avgHeapTotal = relevantSnapshots.reduce((sum, s) => sum + s.heapTotal, 0) / relevantSnapshots.length
			const fragmentationRatio = avgHeapTotal > 0 ? 1 - (avgHeapUsed / avgHeapTotal) : 0

			//TODO: What are these MAGIC NUMBERS?
			// Calculate leak suspicion score
			const steadyGrowth = memoryGrowthRate > 0 && gcEfficiency < 0.5
			const highFragmentation = fragmentationRatio > 0.3
			const excessiveMemoryPerOp = averageMemoryPerOperation > 2048 // 2KB

			let leakSuspicionScore = 0
			//TODO: What are these MAGIC NUMBERS?
			if (steadyGrowth) leakSuspicionScore += 0.4
			if (highFragmentation) leakSuspicionScore += 0.3
			if (excessiveMemoryPerOp) leakSuspicionScore += 0.3

			// Generate recommendations
			const recommendations: string[] = []
			const currentBudget = yield* Ref.get(budget)

			if (averageMemoryPerOperation > currentBudget.maxMemoryPerOperation) {
				recommendations.push(`Memory per operation (${averageMemoryPerOperation.toFixed(0)} bytes) exceeds budget (${currentBudget.maxMemoryPerOperation} bytes)`)
			}
			if (memoryGrowthRate > currentBudget.maxGrowthRate) {
				recommendations.push(`Memory growth rate (${memoryGrowthRate.toFixed(0)} bytes/sec) exceeds budget (${currentBudget.maxGrowthRate} bytes/sec)`)
			}
			if (gcEfficiency < 0.3) {
				recommendations.push("Low garbage collection efficiency. Consider object pooling or manual memory management.")
			}
			if (fragmentationRatio > 0.4) {
				recommendations.push("High memory fragmentation detected. Consider more frequent garbage collection.")
			}
			if (leakSuspicionScore > 0.6) {
				recommendations.push("Potential memory leak detected. Review object lifecycle and references.")
			}
			if (recommendations.length === 0) {
				recommendations.push("Memory usage within acceptable parameters.")
			}

			return {
				averageMemoryPerOperation: Math.max(0, averageMemoryPerOperation),
				peakMemoryUsage,
				memoryGrowthRate,
				gcEfficiency: Math.max(0, Math.min(1, gcEfficiency)),
				fragmentationRatio: Math.max(0, Math.min(1, fragmentationRatio)),
				leakSuspicionScore: Math.max(0, Math.min(1, leakSuspicionScore)),
				recommendations,
			}
		})

	const detectMemoryLeaks = (windowMs = 60000): Effect.Effect<boolean, MemoryLeakDetectedError> =>
		Effect.gen(function* () {
			const analysis = yield* getSnapshotsAndAnalyze(windowMs)

			const currentBudget = yield* Ref.get(budget)
			const leakThreshold = currentBudget.maxGrowthRate * 0.5 // 50% of max growth rate

			if (analysis.memoryGrowthRate > leakThreshold && analysis.leakSuspicionScore > 0.7) {
				return yield* Effect.fail(new MemoryLeakDetectedError(
					analysis.memoryGrowthRate,
					leakThreshold,
					windowMs / 1000,
				))
			}

			return false
		})

	const forceGarbageCollection = (): Effect.Effect<{
		memoryFreed: number;
		success: boolean
	}, GarbageCollectionFailureError> =>
		Effect.gen(function* () {
			const gcResult = yield* tryForceGC()

			// Check if gcResult is a successful result (not an error)
			if ('memoryBefore' in gcResult && 'memoryAfter' in gcResult) {
				const memoryFreed = Math.max(0, gcResult.memoryBefore - gcResult.memoryAfter)

				yield* Effect.logInfo("Garbage collection completed", {
					memoryBefore: `${Math.round(gcResult.memoryBefore / 1024 / 1024)}MB`,
					memoryAfter: `${Math.round(gcResult.memoryAfter / 1024 / 1024)}MB`,
					memoryFreed: `${Math.round(memoryFreed / 1024 / 1024)}MB`,
				})

				// Take a snapshot after GC
				yield* takeSnapshot()

				return {memoryFreed, success: true}
			} else {
				// gcResult is an error type
				return {memoryFreed: 0, success: false}
			}
		})

	const optimizeMemoryUsage = (): Effect.Effect<void, never> =>
		Effect.gen(function* () {
			yield* Effect.logInfo("Optimizing memory usage")

			// Force garbage collection
			yield* forceGarbageCollection().pipe(Effect.ignore)

			// Clear old snapshots (keep last 500)
			yield* Ref.update(snapshots, current => current.slice(-500))

			// Reset operation counts
			yield* Ref.set(operationCounts, new Map())

			yield* Effect.logInfo("Memory optimization completed")
		})

	const setBudget = (budgetUpdate: Partial<MemoryBudget>): Effect.Effect<void, never> =>
		Effect.gen(function* () {
			yield* Ref.update(budget, current => ({...current, ...budgetUpdate}))
			const newBudget = yield* Ref.get(budget)
			yield* Effect.logInfo("Memory budget updated", newBudget)
		})

	const checkBudgetCompliance = (): Effect.Effect<{ compliant: boolean; violations: string[] }, never> =>
		Effect.gen(function* () {
			const currentBudget = yield* Ref.get(budget)
			const latestSnapshot = yield* takeSnapshot()
			const violations: string[] = []

			// Check total memory usage
			if (latestSnapshot.heapUsed > currentBudget.maxTotalMemory) {
				violations.push(`Total memory usage (${Math.round(latestSnapshot.heapUsed / 1024 / 1024)}MB) exceeds budget (${Math.round(currentBudget.maxTotalMemory / 1024 / 1024)}MB)`)
			}

			// Check growth rate
			const analysis = yield* getSnapshotsAndAnalyze(60000)
			if (analysis.averageMemoryPerOperation > 0) { // Analysis was successful
				if (analysis.memoryGrowthRate > currentBudget.maxGrowthRate) {
					violations.push(`Memory growth rate (${analysis.memoryGrowthRate.toFixed(0)} bytes/sec) exceeds budget (${currentBudget.maxGrowthRate} bytes/sec)`)
				}
			}

			return {
				compliant: violations.length === 0,
				violations,
			}
		})

	const generateMemoryReport = (): Effect.Effect<string, never> =>
		Effect.gen(function* () {
			const analysis = yield* getSnapshotsAndAnalyze()
			const currentBudget = yield* Ref.get(budget)
			const allSnapshots = yield* Ref.get(snapshots)
			const {compliant, violations} = yield* checkBudgetCompliance()

			let report = "# Memory Usage Analysis Report\n\n"

			// Executive summary
			report += "## Executive Summary\n"
			report += `- **Budget Compliance:** ${compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n`
			report += `- **Average Memory/Operation:** ${analysis.averageMemoryPerOperation.toFixed(0)} bytes\n`
			report += `- **Target Memory/Operation:** ${currentBudget.maxMemoryPerOperation} bytes\n`
			report += `- **Peak Memory Usage:** ${Math.round(analysis.peakMemoryUsage / 1024 / 1024)} MB\n`
			report += `- **Memory Growth Rate:** ${analysis.memoryGrowthRate.toFixed(0)} bytes/sec\n`
			report += `- **Leak Suspicion Score:** ${(analysis.leakSuspicionScore * 100).toFixed(1)}%\n\n`

			// Budget configuration
			report += "## Memory Budget\n"
			report += `- **Max Memory/Operation:** ${currentBudget.maxMemoryPerOperation} bytes\n`
			report += `- **Max Total Memory:** ${Math.round(currentBudget.maxTotalMemory / 1024 / 1024)} MB\n`
			report += `- **Max Growth Rate:** ${currentBudget.maxGrowthRate.toLocaleString()} bytes/sec\n`
			report += `- **Alert Threshold:** ${currentBudget.alertThreshold}%\n`
			report += `- **Force GC Threshold:** ${currentBudget.forceGCThreshold}%\n\n`

			// Performance metrics
			report += "## Performance Metrics\n"
			report += `- **GC Efficiency:** ${(analysis.gcEfficiency * 100).toFixed(1)}%\n`
			report += `- **Memory Fragmentation:** ${(analysis.fragmentationRatio * 100).toFixed(1)}%\n`
			report += `- **Data Points:** ${allSnapshots.length}\n\n`

			// Violations
			if (!compliant) {
				report += "## ⚠ Budget Violations\n"
				for (const violation of violations) {
					report += `- ${violation}\n`
				}
				report += "\n"
			}

			// Recommendations
			report += "## Recommendations\n"
			for (const recommendation of analysis.recommendations) {
				report += `- ${recommendation}\n`
			}

			return report
		})

	const getMemoryMetrics = (): Effect.Effect<Record<string, number>, never> =>
		Effect.gen(function* () {
			const analysis = yield* getSnapshotsAndAnalyze()
			const allSnapshots = yield* Ref.get(snapshots)
			const currentMemory = getCurrentMemoryUsage()

			return {
				averageMemoryPerOperation: analysis.averageMemoryPerOperation,
				peakMemoryUsage: analysis.peakMemoryUsage,
				currentMemoryUsage: currentMemory.heapUsed,
				memoryGrowthRate: analysis.memoryGrowthRate,
				gcEfficiency: analysis.gcEfficiency,
				fragmentationRatio: analysis.fragmentationRatio,
				leakSuspicionScore: analysis.leakSuspicionScore,
				totalSnapshots: allSnapshots.length,
			}
		})

	return MEMORY_MONITOR_SERVICE.of({
		startMonitoring,
		stopMonitoring,
		takeSnapshot,
		//TODO: I tried to make this safer with generics but I have a hard time fixing this bug.
		measureOperationMemory,
		analyzeMemoryUsage,
		detectMemoryLeaks,
		forceGarbageCollection,
		optimizeMemoryUsage,
		setBudget,
		checkBudgetCompliance,
		generateMemoryReport,
		getMemoryMetrics,
	})
})

// EFFECT LAYER FOR DEPENDENCY INJECTION
export const MEMORY_MONITOR_SERVICE_LIVE = Layer.effect(MEMORY_MONITOR_SERVICE, makeMemoryMonitorService)

/**
 * High-level memory-aware validation wrapper
 */
export const withMemoryTracking = <T, E extends Error>(
	operation: Effect.Effect<T, E>,
	operationType: string,
): Effect.Effect<T, MemoryThresholdExceededError | E, MemoryMonitorService> =>
	Effect.gen(function* () {
		const memoryMonitor = yield* MEMORY_MONITOR_SERVICE
		const {result} = yield* memoryMonitor.measureOperationMemory(operation, operationType)
		return result
	})

/**
 * Memory budget enforcement for validation batches
 */
export const withMemoryBudgetEnforcement = <T, E extends Error>(
	operations: Array<Effect.Effect<T, E>>,
	budget: Partial<MemoryBudget> = {},
): Effect.Effect<T[], MemoryThresholdExceededError | E, MemoryMonitorService> =>
	Effect.gen(function* () {
		const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

		// Set temporary budget
		yield* memoryMonitor.setBudget(budget)

		// Execute operations with memory tracking
		const results = yield* Effect.forEach(
			operations,
			(operation, index) => withMemoryTracking(operation, `batch-operation-${index}`),
			{concurrency: 10}, // Controlled concurrency to manage memory
		)

		// Check final budget compliance
		const {compliant, violations} = yield* memoryMonitor.checkBudgetCompliance()
		if (!compliant) {
			yield* Effect.logWarning("Memory budget violations after batch execution", {
				violations: violations.join(", "),
			})
		}

		return results
	})
