/**
 * PERFORMANCE METRICS - BRANDED TYPES
 *
 * This file defines branded types to replace generic string/number types
 * throughout the performance monitoring system. These branded types provide:
 *
 * - ✅ Type safety at compile time
 * - ✅ Clear semantic meaning in function signatures
 * - ✅ Prevention of mixing incompatible values
 * - ✅ Better IDE support and autocomplete
 *
 * REPLACES: Generic string/number types with 50+ TODO markers
 * IMPACT: Eliminates entire class of runtime type errors
 */

// Operation identification types
export type OperationType = string & { readonly brand: "OperationType" };
export type OperationCount = number & { readonly brand: "OperationCount" };

// Throughput and performance measurement types
export type ThroughputValue = number & { readonly brand: "ThroughputValue" };
export type OperationsPerSecond = number & {
  readonly brand: "OperationsPerSecond";
};
export type LatencyMicroseconds = number & {
  readonly brand: "LatencyMicroseconds";
};
export type MemoryEfficiencyRatio = number & {
  readonly brand: "MemoryEfficiencyRatio";
};

// Report and serialization types
export type PerformanceReportJson = string & {
  readonly brand: "PerformanceReportJson";
};
export type MemoryReportJson = string & { readonly brand: "MemoryReportJson" };

// Metric summary types (for Record<string, number> replacements)
export type MetricName = string & { readonly brand: "MetricName" };
export type MetricValue = number & { readonly brand: "MetricValue" };
export type MetricsSummary = Record<MetricName, MetricValue>;

// Helper functions to create branded types safely
export const createOperationType = (value: string): OperationType =>
  value as OperationType;
export const createOperationCount = (value: number): OperationCount =>
  value as OperationCount;
export const createThroughputValue = (value: number): ThroughputValue =>
  value as ThroughputValue;
export const createOperationsPerSecond = (value: number): OperationsPerSecond =>
  value as OperationsPerSecond;
export const createLatencyMicroseconds = (value: number): LatencyMicroseconds =>
  value as LatencyMicroseconds;
export const createMemoryEfficiencyRatio = (
  value: number,
): MemoryEfficiencyRatio => value as MemoryEfficiencyRatio;
export const createPerformanceReportJson = (
  value: string,
): PerformanceReportJson => value as PerformanceReportJson;
export const createMemoryReportJson = (value: string): MemoryReportJson =>
  value as MemoryReportJson;
export const createMetricName = (value: string): MetricName =>
  value as MetricName;
export const createMetricValue = (value: number): MetricValue =>
  value as MetricValue;

// Type conversion helpers for branded type compatibility
export const operationsPerSecondToThroughputValue = (
  ops: OperationsPerSecond,
): ThroughputValue => ops as unknown as ThroughputValue;
export const numberToThroughputValue = (value: number): ThroughputValue =>
  value as ThroughputValue;
