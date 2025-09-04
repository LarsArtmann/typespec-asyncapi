// PERFORMANCE METRICS SERVICE
import type {Effect} from "effect"
import type {ByteAmount} from "./ByteAmount.js"
import type {MemoryThresholdExceededError} from "../errors/MemoryThresholdExceededError.js"
import type {MetricsCollectionError} from "../errors/MetricsCollectionError.js"
import type {MetricsInitializationError} from "../errors/MetricsInitializationError.js"
import type {ThroughputBelowTargetError} from "../errors/ThroughputBelowTargetError.js"
import type {PerformanceMeasurement} from "./PerformanceMeasurement.js"
import type {ThroughputResult} from "./ThroughputResult.js"
import type {AsyncAPIEmitterOptions} from "../../infrastructure/configuration/options.js"
import type { Milliseconds } from "./Durations.js"
import type { OperationType, OperationCount, ThroughputValue, PerformanceReportJson, MetricsSummary } from "./PerformanceTypes.js"

export type PerformanceMetricsService = {
	// Core measurement functions
	startMeasurement: (operationType: OperationType) => Effect.Effect<PerformanceMeasurement, MetricsInitializationError>;
	recordThroughput: (measurement: PerformanceMeasurement, operationCount: OperationCount) => Effect.Effect<ThroughputResult, MetricsCollectionError>;
	recordMemoryUsage: (bytes: ByteAmount) => Effect.Effect<void, MetricsCollectionError>;

	// Validation-specific metrics
	measureValidationBatch: <E>(validations: Array<() => Effect.Effect<AsyncAPIEmitterOptions, E>>) => Effect.Effect<ThroughputResult, MetricsCollectionError | MemoryThresholdExceededError>;

	// Performance targets validation
	validateThroughputTarget: (actualThroughput: ThroughputValue, targetThroughput?: ThroughputValue) => Effect.Effect<void, ThroughputBelowTargetError>;
	validateMemoryTarget: (memoryUsage: ByteAmount, targetMemory?: ByteAmount) => Effect.Effect<void, MemoryThresholdExceededError>;

	// Reporting
	generatePerformanceReport: () => Effect.Effect<PerformanceReportJson, MetricsCollectionError>;
	getMetricsSummary: () => Effect.Effect<MetricsSummary, MetricsCollectionError>;

	// Resource monitoring
	startContinuousMonitoring: (intervalMs?: Milliseconds) => Effect.Effect<void, MetricsCollectionError>;
	stopContinuousMonitoring: () => Effect.Effect<void, never>;
}
