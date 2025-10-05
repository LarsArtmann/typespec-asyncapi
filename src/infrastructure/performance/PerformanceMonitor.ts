/**
 * PerformanceMonitor - Micro-kernel Performance Tracking
 *
 * Lightweight performance monitoring wrapper that integrates with
 * the existing performance system while providing micro-kernel abstractions.
 *
 * Key Responsibilities:
 * - Start/stop monitoring coordination
 * - Performance metrics aggregation
 * - Resource usage tracking
 * - Plugin performance isolation
 * - Memory leak detection
 */

import {Effect} from "effect"
import {PERFORMANCE_METRICS_SERVICE} from "../performance/metrics.js"
import {MEMORY_MONITOR_SERVICE} from "../performance/memory-monitor.js"
import {createMetricName} from "../performance/PerformanceTypes.js"
import {safeStringify} from "../../utils/standardized-errors.js"

// Performance monitoring constants
const DEFAULT_MONITORING_INTERVAL_MS = 5000 // 5 seconds
const DEFAULT_MEMORY_THRESHOLD_MB = 500 // 500MB
const DEFAULT_MEMORY_LEAK_DETECTION_RATE = 0.1 // MB/sec
const MAX_SNAPSHOTS_RETAINED = 100

export type PerformanceConfig = {
	enableMetrics: boolean
	enableMemoryMonitoring: boolean
	monitoringInterval: number // in ms
	memoryThreshold: number // in MB
	enableLeakDetection: boolean
}

export type PerformanceSnapshot = {
	timestamp: Date
	memoryUsage: number
	operationCount: number
	averageLatency: number
	throughput: number
}

/**
 * Micro-kernel performance monitor with plugin isolation
 */
export class PerformanceMonitor {
	private readonly config: PerformanceConfig
	private isMonitoring: boolean = false
	private snapshots: PerformanceSnapshot[] = []
	private monitoringTimer?: NodeJS.Timeout | undefined

	constructor(config?: Partial<PerformanceConfig>) {
		// Initialize with production-ready defaults that can be overridden per environment
		this.config = {
			enableMetrics: true,
			enableMemoryMonitoring: true,
			monitoringInterval: DEFAULT_MONITORING_INTERVAL_MS,
			memoryThreshold: DEFAULT_MEMORY_THRESHOLD_MB,
			enableLeakDetection: true,
			...config,
		}

		Effect.log(`📊 PerformanceMonitor initialized with config: ${JSON.stringify(this.config)}`)
	}

	/**
	 * Start performance monitoring
	 */
	startMonitoring() {
		return Effect.gen(function* (this: PerformanceMonitor) {
			if (this.isMonitoring) {
				Effect.log(`⚠️ Performance monitoring already active`)
				return
			}

			Effect.log(`📊 Starting performance monitoring...`)

			if (this.config.enableMemoryMonitoring) {
				const memoryMonitor = yield* MEMORY_MONITOR_SERVICE
				yield* memoryMonitor.startMonitoring(this.config.monitoringInterval)
			}

			this.isMonitoring = true
			this.startPeriodicSnapshots()

			Effect.log(`✅ Performance monitoring started`)
		}.bind(this))
	}

	/**
	 * Stop performance monitoring
	 */
	stopMonitoring() {
		return Effect.gen(function* (this: PerformanceMonitor) {
			if (!this.isMonitoring) {
				Effect.log(`⚠️ Performance monitoring not active`)
				return
			}

			Effect.log(`📊 Stopping performance monitoring...`)

			if (this.config.enableMemoryMonitoring) {
				const memoryMonitor = yield* MEMORY_MONITOR_SERVICE
				yield* memoryMonitor.stopMonitoring()
			}

			this.isMonitoring = false
			this.stopPeriodicSnapshots()

			// Generate final report
			const report = this.generatePerformanceReport()
			Effect.log(`📊 Final Performance Report:\n${report}`)

			Effect.log(`✅ Performance monitoring stopped`)
		}.bind(this))
	}

	/**
	 * Log snapshot metrics - extracted to eliminate duplication
	 */
	private logSnapshotMetrics(snapshot: PerformanceSnapshot) {
		return Effect.tap((s: PerformanceSnapshot) => Effect.log(`📊 Performance snapshot taken: ${s.memoryUsage.toFixed(1)}MB memory, ${s.operationCount} operations`))
	}

	/**
	 * Handle snapshot error - extracted to eliminate duplication
	 */
	private logSnapshotError(error: Error) {
		return Effect.logError(`❌ ${error.message}`)
	}

	/**
	 * Take a performance snapshot synchronously (simplified)
	 */
	private takeSnapshotSync(): void {
		if (!this.config.enableMetrics) {
			return
		}

		// Use Effect.try for safe snapshot creation
		Effect.runSync(Effect.try({
			try: () => {
				// Create simplified snapshot with basic metrics
				const snapshot: PerformanceSnapshot = {
					timestamp: new Date(),
					memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
					operationCount: 0, // Will be populated by actual metrics; <-- TODO: where, by who???
					averageLatency: 0,
					throughput: 0,
				}

				this.addSnapshotWithMemoryManagement(snapshot, snapshot.memoryUsage)
				return snapshot
			},
			catch: (error) => new Error(`Failed to take performance snapshot: ${error instanceof Error ? error.message : String(error)}`)
		}).pipe(
			this.logSnapshotMetrics.bind(this),
			Effect.catchAll(this.logSnapshotError.bind(this))
		))
	}

	/**
	 * Take a performance snapshot (full Effect.TS version)
	 */
	takeSnapshot() {
		return Effect.gen(function* (this: PerformanceMonitor) {
			if (!this.config.enableMetrics) {
				return
			}

			// Use Effect.try for comprehensive snapshot creation with proper error handling
			yield* Effect.try({
				try: () => Effect.gen(function* (this: PerformanceMonitor) {
					const metricsService = yield* PERFORMANCE_METRICS_SERVICE
					const memoryMonitor = yield* MEMORY_MONITOR_SERVICE

					// Get current memory metrics
					const memoryMetrics = yield* memoryMonitor.getMemoryMetrics()
					const currentMemory = memoryMetrics.currentMemoryUsage ?? 0

					// Get performance metrics summary
					const metricsSummary = yield* metricsService.getMetricsSummary()

					const snapshot: PerformanceSnapshot = {
						timestamp: new Date(),
						memoryUsage: currentMemory,
						operationCount: metricsSummary[createMetricName("throughput")] ?? 0, // Using throughput as operation count approximation
						averageLatency: metricsSummary[createMetricName("latency")] ?? 0,
						throughput: metricsSummary[createMetricName("throughput")] ?? 0,
					}

					this.addSnapshotWithMemoryManagement(snapshot, currentMemory)
					return snapshot
				}.bind(this)),
				catch: (error) => new Error(`Failed to take performance snapshot: ${safeStringify(error)}`)
			}).pipe(
				Effect.flatten,
				this.logSnapshotMetrics.bind(this),
				Effect.catchAll(this.logSnapshotError.bind(this))
			)
		}.bind(this))
	}

	/**
	 * Start periodic performance snapshots
	 */
	private startPeriodicSnapshots(): void {
		if (!this.config.enableMetrics) {
			return
		}

		this.monitoringTimer = setInterval(() => {
			// Use simplified sync version for periodic snapshots
			this.takeSnapshotSync()
		}, this.config.monitoringInterval)

		Effect.log(`📊 Periodic snapshots started (interval: ${this.config.monitoringInterval}ms)`)
	}

	/**
	 * Stop periodic performance snapshots
	 */
	private stopPeriodicSnapshots(): void {
		if (this.monitoringTimer) {
			clearInterval(this.monitoringTimer)
			this.monitoringTimer = undefined
			Effect.log(`📊 Periodic snapshots stopped`)
		}
	}

	/**
	 * Generate performance report from snapshots
	 * TODO: Split calculations and display logic into 2 semi-independent functions
	 */
	generatePerformanceReport(): string {
		if (this.snapshots.length === 0) {
			return "No performance data available"
		}

		const latest = this.snapshots[this.snapshots.length - 1]
		const earliest = this.snapshots[0]
		
		if (!latest || !earliest) {
			return "Insufficient performance data available"
		}
		
		const duration = latest.timestamp.getTime() - earliest.timestamp.getTime()

		// Calculate averages and peaks
		const avgMemory = this.snapshots.reduce((sum, s) => sum + s.memoryUsage, 0) / this.snapshots.length
		const peakMemory = Math.max(...this.snapshots.map(s => s.memoryUsage))
		const avgThroughput = this.snapshots.reduce((sum, s) => sum + s.throughput, 0) / this.snapshots.length
		const avgLatency = this.snapshots.reduce((sum, s) => sum + s.averageLatency, 0) / this.snapshots.length

		// Memory growth analysis
		const memoryGrowth = this.snapshots.length > 1 ? latest.memoryUsage - earliest.memoryUsage : 0
		const memoryGrowthRate = duration > 0 ? (memoryGrowth / (duration / 1000)) : 0 // MB/sec

		let report = `\n📊 Performance Summary (${this.snapshots.length} snapshots over ${(duration / 1000).toFixed(1)}s)\n`
		report += `🧠 Memory Usage:\n`
		report += `  - Current: ${latest.memoryUsage.toFixed(1)} MB\n`
		report += `  - Average: ${avgMemory.toFixed(1)} MB\n`
		report += `  - Peak: ${peakMemory.toFixed(1)} MB\n`
		report += `  - Growth: ${memoryGrowth.toFixed(1)} MB (${memoryGrowthRate.toFixed(2)} MB/sec)\n`

		report += `⚡ Performance Metrics:\n`
		report += `  - Operations: ${latest.operationCount}\n`
		report += `  - Avg Throughput: ${avgThroughput.toFixed(1)} ops/sec\n`
		report += `  - Avg Latency: ${avgLatency.toFixed(2)} ms\n`

		// Memory leak detection
		if (this.config.enableLeakDetection) {
			const memoryIncreasing = memoryGrowthRate > DEFAULT_MEMORY_LEAK_DETECTION_RATE
			const highMemoryUsage = latest.memoryUsage > this.config.memoryThreshold

			if (memoryIncreasing ?? highMemoryUsage) {
				report += `\n⚠️ Memory Concerns:\n`
				if (memoryIncreasing) {
					report += `  - Continuous memory growth detected (${memoryGrowthRate.toFixed(2)} MB/sec)\n`
				}
				if (highMemoryUsage) {
					report += `  - High memory usage (${latest.memoryUsage.toFixed(1)} MB > ${this.config.memoryThreshold} MB threshold)\n`
				}
				report += `  - Consider investigating memory leaks\n`
			} else {
				report += `\n✅ Memory Health: Good\n`
			}
		}

		return report
	}

	/**
	 * Get current performance status
	 */
	getPerformanceStatus(): {
		isMonitoring: boolean
		snapshotCount: number
		latestSnapshot?: PerformanceSnapshot
	} {
		const latestSnapshot = this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : undefined
		return {
			isMonitoring: this.isMonitoring,
			snapshotCount: this.snapshots.length,
			...(latestSnapshot ? { latestSnapshot } : {})
		}
	}

	/**
	 * Clear performance history
	 */
	clearHistory(): void {
		this.snapshots = []
		Effect.log(`📊 Performance history cleared`)
	}

	/**
	 * Get performance snapshots for external analysis
	 */
	getSnapshots(): PerformanceSnapshot[] {
		return [...this.snapshots] // Return a copy
	}

	/**
	 * Force garbage collection (if available)
	 */
	forceGarbageCollection() {
		return Effect.gen(function* () {
			const gcResult = yield* Effect.gen(function* () {
				const memoryMonitor = yield* MEMORY_MONITOR_SERVICE
				return yield* memoryMonitor.forceGarbageCollection()
			}).pipe(
				Effect.tap(result => Effect.log(`🗑️ Garbage collection completed: freed ${result.memoryFreed} MB`)),
				Effect.catchAll(error => 
					Effect.sync(() => {
						Effect.runSync(Effect.logWarning(`⚠️ Garbage collection not available: ${safeStringify(error)}`))
						return null
					})
				)
			)
			return gcResult
		})
	}

	/**
	 * Add snapshot and manage memory - eliminates duplication
	 * Used by takeSnapshot and background monitoring
	 */
	private addSnapshotWithMemoryManagement(snapshot: PerformanceSnapshot, memoryUsage: number): void {
		this.snapshots.push(snapshot)

		// Keep only last N snapshots to prevent memory growth
		if (this.snapshots.length > MAX_SNAPSHOTS_RETAINED) {
			this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS_RETAINED)
		}

		// Check for memory threshold violations
		if (this.config.enableLeakDetection && memoryUsage > this.config.memoryThreshold) {
			Effect.logWarning(`⚠️ Memory usage ${memoryUsage.toFixed(1)}MB exceeds threshold ${this.config.memoryThreshold}MB`)
		}
	}
}