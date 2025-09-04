// MEMORY MONITORING SERVICE
import type {MemoryMonitorInitializationError} from "../errors/MemoryMonitorInitializationError.js"
import type {Effect} from "effect"
import type {GarbageCollectionFailureError} from "../errors/GarbageCollectionFailureError.js"
import type {MemoryLeakDetectedError} from "../errors/MemoryLeakDetectedError.js"
import type {MemoryThresholdExceededError} from "../errors/MemoryThresholdExceededError.js"
import type {MemoryAnalysis} from "./MemoryAnalysis.js"
import type {MemoryBudget} from "./MemoryBudget.js"
import type {MemorySnapshot} from "./MemorySnapshot.js"
import type {CheckBudgetCompliance} from "./CheckBudgetCompliance.js"
import type {ForceGarbageCollection} from "./ForceGarbageCollection.js"
import type {MeasureOperationMemory} from "./MeasureOperationMemory.js"
import type {Milliseconds} from "./Durations.js"
import type {OperationType, MemoryReportJson} from "./PerformanceTypes.js"

export type MemoryMonitorService = {
	// Core monitoring functions
	startMonitoring: (intervalMs?: Milliseconds) => Effect.Effect<void, MemoryMonitorInitializationError>;
	stopMonitoring: () => Effect.Effect<void, never>;

	// Memory measurement
	takeSnapshot: (operationCount?: number) => Effect.Effect<MemorySnapshot, never>;
	measureOperationMemory: <R, E extends Error>(operation: Effect.Effect<R, MemoryThresholdExceededError | E>, operationType: OperationType) => Effect.Effect<MeasureOperationMemory<R>, MemoryThresholdExceededError | E>;

	// Analysis and reporting
	analyzeMemoryUsage: (snapshots: MemorySnapshot[], windowMs?: Milliseconds) => Effect.Effect<MemoryAnalysis, never>;
	detectMemoryLeaks: (windowMs?: Milliseconds) => Effect.Effect<boolean, MemoryLeakDetectedError>;

	// Memory management
	forceGarbageCollection: () => Effect.Effect<ForceGarbageCollection, GarbageCollectionFailureError>;
	optimizeMemoryUsage: () => Effect.Effect<void, never>;

	// Budget enforcement
	setBudget: (budget: Partial<MemoryBudget>) => Effect.Effect<void, never>;
	checkBudgetCompliance: () => Effect.Effect<CheckBudgetCompliance, never>;

	// Reporting
	generateMemoryReport: () => Effect.Effect<MemoryReportJson, never>;
	getMemoryMetrics: () => Effect.Effect<Record<string, number>, never>;
}