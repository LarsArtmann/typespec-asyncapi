// MEMORY MONITORING SERVICE
import type {MemoryMonitorInitializationError} from "@/errors/MemoryMonitorInitializationError.js"
import type {Effect} from "effect"
import type {
	GarbageCollectionFailureError,
	MemoryAnalysis,
	MemoryBudget,
	MemoryLeakDetectedError,
	MemorySnapshot,
} from "@/performance/memory-monitor.js"
import type {MemoryThresholdExceededError} from "@/errors/MemoryThresholdExceededError.js"
import type {CheckBudgetCompliance} from "@/performance/CheckBudgetCompliance.js"
import type {ForceGarbageCollection} from "@/performance/ForceGarbageCollection.js"
import type {MeasureOperationMemory} from "@/performance/MeasureOperationMemory.js"

export type Milliseconds = number

export type MemoryMonitorService = {
	// Core monitoring functions
	startMonitoring: (intervalMs?: Milliseconds) => Effect.Effect<void, MemoryMonitorInitializationError>;
	stopMonitoring: () => Effect.Effect<void, never>;

	// Memory measurement
	takeSnapshot: (operationCount?: number) => Effect.Effect<MemorySnapshot, never>;
	//TODO: replace nothing saying strings with named types!
	measureOperationMemory: <R, E extends Error>(operation: Effect.Effect<R, MemoryThresholdExceededError | E>, operationType: string) => Effect.Effect<MeasureOperationMemory<R>, MemoryThresholdExceededError | E>;

	// Analysis and reporting
	analyzeMemoryUsage: (snapshots: MemorySnapshot[], windowMs?: Milliseconds) => Effect.Effect<MemoryAnalysis, never>;
	detectMemoryLeaks: (windowMs?: Milliseconds) => Effect.Effect<boolean, MemoryLeakDetectedError>;

	// Memory management
	forceGarbageCollection: () => Effect.Effect<ForceGarbageCollection, GarbageCollectionFailureError>;
	optimizeMemoryUsage: () => Effect.Effect<void, never>;

	// Budget enforcement
	setBudget: (budget: Partial<MemoryBudget>) => Effect.Effect<void, never>;
	checkBudgetCompliance: () => Effect.Effect<CheckBudgetCompliance, never>;

	//TODO: replace nothing saying strings with named types!
	// Reporting
	generateMemoryReport: () => Effect.Effect<string, never>;
	//TODO: replace nothing saying strings with named types!
	getMemoryMetrics: () => Effect.Effect<Record<string, number>, never>;
}