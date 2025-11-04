/**
 * Performance Monitoring Infrastructure
 * 
 * Provides performance metrics collection and monitoring capabilities.
 * Designed to work with Effect.TS patterns for proper error handling.
 */

import { Effect, gen } from "effect"

export type PerformanceSnapshot = {
	/** Current memory usage in megabytes */
	memoryUsageMB: number
	/** Timestamp of snapshot */
	timestamp: number
}

export type PerformanceData = {
	/** Array of performance snapshots */
	snapshots: PerformanceSnapshot[]
	/** Start time */
	startTime: number
}

/**
 * Performance Monitor
 * 
 * Collects and manages performance metrics during test execution.
 * Provides Effect.TS-compatible APIs for integration.
 */
export class PerformanceMonitor {
	private performanceData: PerformanceData = {
		snapshots: [],
		startTime: 0,
	}

	/**
	 * Start monitoring performance metrics
	 */
	startMonitoring = (): Effect.Effect<void, never, never> =>
		Effect.sync(() => {
			this.performanceData.startTime = performance.now()
			// Initial snapshot
			this.collectSnapshot()
		})

	/**
	 * Collect current performance snapshot
	 */
	collectSnapshot = (): Effect.Effect<void, never, never> =>
		Effect.sync(() => {
			const snapshot: PerformanceSnapshot = {
				memoryUsageMB: this.getMemoryUsage(),
				timestamp: performance.now(),
			}
			this.performanceData.snapshots.push(snapshot)
		})

	/**
	 * Get current memory usage (simplified implementation)
	 */
	private getMemoryUsage = (): number => {
		// Simplified memory calculation
		// In a real implementation, this would use process.memoryUsage() or similar
		if (typeof process !== "undefined" && process.memoryUsage) {
			return process.memoryUsage().heapUsed / 1024 / 1024
		}
		return 0 // Default for browser environments
	}

	/**
	 * Collect final performance metrics
	 */
	collectMetrics = (): Effect.Effect<{
		memoryUsageMB: number
		averageLatencyMs: number
		peakMemoryUsageMB: number
	}, never, never> =>
		Effect.sync(() => {
			const snapshots = this.performanceData.snapshots
			if (snapshots.length === 0) {
				return {
					memoryUsageMB: 0,
					averageLatencyMs: 0,
					peakMemoryUsageMB: 0,
				}
			}

			const memoryUsages = snapshots.map(s => s.memoryUsageMB)
			const peakMemoryUsageMB = Math.max(...memoryUsages)
			const averageMemoryUsageMB = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length

			// Calculate average latency based on snapshot timing
			const timeSpan = snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp
			const averageLatencyMs = snapshots.length > 1 ? timeSpan / (snapshots.length - 1) : 0

			return {
				memoryUsageMB: averageMemoryUsageMB,
				averageLatencyMs,
				peakMemoryUsageMB,
			}
		})

	/**
	 * Reset performance data
	 */
	reset = (): Effect.Effect<void, never, never> =>
		Effect.sync(() => {
			this.performanceData = {
				snapshots: [],
				startTime: 0,
			}
		})
}