// PERFORMANCE METRICS SERVICE
import type {Effect} from "effect"
import type {ByteAmount} from "./ByteAmount.js"
import type {MemoryThresholdExceededError} from "../errors/MemoryThresholdExceededError.js"
import type {MetricsCollectionError} from "../errors/MetricsCollectionError.js"
import type {MetricsInitializationError} from "../errors/MetricsInitializationError.js"
import type {ThroughputBelowTargetError} from "../errors/ThroughputBelowTargetError.js"
import type {PerformanceMeasurement} from "./PerformanceMeasurement.js"
import type {ThroughputResult} from "./ThroughputResult.js"
import type {AsyncAPIEmitterOptions} from "../options.js"

type Milliseconds = number

export type PerformanceMetricsService = {
	// Core measurement functions
	//TODO: replace nothing saying string with named types!
	startMeasurement: (operationType: string) => Effect.Effect<PerformanceMeasurement, MetricsInitializationError>;
	//TODO: replace nothing saying number with named types!
	recordThroughput: (measurement: PerformanceMeasurement, operationCount: number) => Effect.Effect<ThroughputResult, MetricsCollectionError>;
	recordMemoryUsage: (bytes: ByteAmount) => Effect.Effect<void, MetricsCollectionError>;

	// Validation-specific metrics
	measureValidationBatch: <E>(validations: Array<() => Effect.Effect<AsyncAPIEmitterOptions, E>>) => Effect.Effect<ThroughputResult, MetricsCollectionError | MemoryThresholdExceededError>;

	//TODO: replace nothing saying numbers with named types!
	// Performance targets validation
	validateThroughputTarget: (actualThroughput: number, targetThroughput?: number) => Effect.Effect<void, ThroughputBelowTargetError>;
	//TODO: replace nothing saying numbers with named types!
	validateMemoryTarget: (memoryUsage: number, targetMemory?: number) => Effect.Effect<void, MemoryThresholdExceededError>;

	//TODO: replace nothing saying string with named types!
	// Reporting
	generatePerformanceReport: () => Effect.Effect<string, MetricsCollectionError>;
	//TODO: replace nothing saying string,number with named types!
	getMetricsSummary: () => Effect.Effect<Record<string, number>, MetricsCollectionError>;

	// Resource monitoring
	startContinuousMonitoring: (intervalMs?: Milliseconds) => Effect.Effect<void, MetricsCollectionError>;
	stopContinuousMonitoring: () => Effect.Effect<void, never>;
}
