/**
 * PERFORMANCE AND MEMORY ERROR CLASSES
 * 
 * Handles memory usage errors, timeout errors, and performance threshold violations
 * with comprehensive degradation strategies
 */

import { BaseAsyncAPIError, type ErrorSeverity } from "./base.js";

/**
 * Memory usage error when operation exceeds memory limits
 */
export class MemoryUsageError extends BaseAsyncAPIError {
  readonly _tag = "MemoryUsageError" as const;
  
  constructor({
    operation,
    currentUsageMB,
    thresholdMB,
    peakUsageMB,
    canOptimize,
    severity = "warning"
  }: {
    operation: string;
    currentUsageMB: number;
    thresholdMB: number;
    peakUsageMB?: number;
    canOptimize?: boolean;
    severity?: ErrorSeverity;
  }) {
    const overageMB = currentUsageMB - thresholdMB;
    
    super({
      what: `Memory usage exceeded threshold during ${operation}: ${currentUsageMB}MB (limit: ${thresholdMB}MB)`,
      reassure: "Memory usage errors can often be resolved by optimizing the input or enabling streaming mode.",
      why: `The operation requires ${overageMB}MB more memory than the configured limit allows.`,
      fix: [
        "Reduce the size or complexity of input files",
        "Increase memory limits in configuration",
        "Enable streaming mode for large inputs if available",
        "Break large schemas into smaller modules"
      ],
      escape: canOptimize 
        ? "Will enable memory optimization mode and retry the operation"
        : "Processing will continue but may be slower and use more resources",
      severity,
      category: "memory",
      operation,
      recoveryStrategy: canOptimize ? "fallback" : "degrade",
      canRecover: true,
      recoveryHint: canOptimize ? "Enabling memory optimization" : "Continue with higher memory usage",
      additionalData: { currentUsageMB, thresholdMB, peakUsageMB, overageMB, canOptimize }
    });
  }
}

/**
 * Operation timeout error
 */
export class OperationTimeoutError extends BaseAsyncAPIError {
  readonly _tag = "OperationTimeoutError" as const;
  
  constructor({
    operation,
    timeoutMs,
    elapsedMs,
    canRetry,
    suggestedTimeoutMs,
    severity = "error"
  }: {
    operation: string;
    timeoutMs: number;
    elapsedMs?: number;
    canRetry?: boolean;
    suggestedTimeoutMs?: number;
    severity?: ErrorSeverity;
  }) {
    const timeoutSec = Math.round(timeoutMs / 1000);
    const elapsedSec = elapsedMs ? Math.round(elapsedMs / 1000) : timeoutSec;
    
    super({
      what: `Operation '${operation}' timed out after ${elapsedSec}s (limit: ${timeoutSec}s)`,
      reassure: "Timeout errors usually indicate the operation is taking longer than expected and can be resolved.",
      why: "The operation exceeded the configured timeout threshold.",
      fix: [
        suggestedTimeoutMs ? `Increase timeout to ${Math.round(suggestedTimeoutMs / 1000)}s` : "Increase the timeout configuration",
        "Reduce the complexity of the input",
        "Check for performance bottlenecks in the TypeSpec definitions",
        "Enable progress monitoring to track long-running operations"
      ],
      escape: canRetry 
        ? "Will retry the operation with extended timeout"
        : "Operation will be cancelled to prevent system hang",
      severity,
      category: "memory",
      operation,
      recoveryStrategy: canRetry ? "retry" : "abort",
      canRecover: canRetry ?? false,
      recoveryHint: canRetry ? "Retrying with extended timeout" : undefined,
      additionalData: { timeoutMs, elapsedMs, suggestedTimeoutMs }
    });
  }
}

/**
 * Performance threshold violation
 */
export class PerformanceThresholdError extends BaseAsyncAPIError {
  readonly _tag = "PerformanceThresholdError" as const;
  
  constructor({
    metric,
    actual,
    threshold,
    operation,
    optimizationHints,
    severity = "warning"
  }: {
    metric: string;
    actual: number;
    threshold: number;
    operation: string;
    optimizationHints?: string[];
    severity?: ErrorSeverity;
  }) {
    const unit = metric.includes('memory') ? 'MB' : metric.includes('time') ? 'ms' : '';
    const percentOverage = Math.round(((actual - threshold) / threshold) * 100);
    
    super({
      what: `Performance threshold exceeded: ${metric} is ${actual}${unit}, threshold is ${threshold}${unit} (+${percentOverage}%)`,
      reassure: "Performance issues can often be resolved by optimizing the input or configuration.",
      why: `The ${metric} metric exceeded the configured performance threshold by ${percentOverage}%.`,
      fix: optimizationHints || [
        "Optimize the TypeSpec definitions for better performance",
        "Reduce the size or complexity of input files",
        "Enable performance optimizations in configuration",
        "Consider using incremental processing for large inputs"
      ],
      escape: "Processing will continue with performance monitoring enabled",
      severity,
      category: "memory",
      operation,
      recoveryStrategy: "degrade",
      canRecover: true,
      recoveryHint: "Continue with degraded performance",
      additionalData: { metric, actual, threshold, unit, percentOverage, optimizationHints }
    });
  }
}

/**
 * Resource exhaustion error
 */
export class ResourceExhaustionError extends BaseAsyncAPIError {
  readonly _tag = "ResourceExhaustionError" as const;
  
  constructor({
    resourceType,
    operation,
    limit,
    current,
    canCleanup,
    severity = "error"
  }: {
    resourceType: string;
    operation: string;
    limit: number;
    current: number;
    canCleanup?: boolean;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `${resourceType} resource exhaustion during ${operation}: ${current}/${limit} used`,
      reassure: "Resource exhaustion can be resolved by cleaning up unused resources or increasing limits.",
      why: `The operation has reached the maximum allowed ${resourceType} usage.`,
      fix: [
        canCleanup ? `Clean up unused ${resourceType} resources` : `Increase the ${resourceType} limit`,
        "Optimize resource usage patterns in the application",
        "Enable resource monitoring and alerts",
        "Consider using resource pooling or recycling"
      ],
      escape: canCleanup 
        ? "Will attempt to clean up unused resources and retry"
        : "Operation will be terminated to prevent system instability",
      severity,
      category: "memory",
      operation,
      recoveryStrategy: canCleanup ? "fallback" : "abort",
      canRecover: canCleanup ?? false,
      recoveryHint: canCleanup ? "Attempting resource cleanup" : undefined,
      additionalData: { resourceType, limit, current, canCleanup }
    });
  }
}

/**
 * Concurrent operation limit error
 */
export class ConcurrencyLimitError extends BaseAsyncAPIError {
  readonly _tag = "ConcurrencyLimitError" as const;
  
  constructor({
    operation,
    currentConcurrency,
    maxConcurrency,
    queueSize,
    canQueue,
    severity = "warning"
  }: {
    operation: string;
    currentConcurrency: number;
    maxConcurrency: number;
    queueSize?: number;
    canQueue?: boolean;
    severity?: ErrorSeverity;
  }) {
    super({
      what: `Concurrency limit reached for ${operation}: ${currentConcurrency}/${maxConcurrency} active operations`,
      reassure: "Concurrency limits help prevent system overload and can be managed through queueing.",
      why: "The system has reached the maximum number of concurrent operations allowed.",
      fix: [
        "Wait for current operations to complete",
        "Increase the concurrency limit if system resources allow",
        "Optimize operations to complete faster",
        "Use operation batching to reduce concurrency requirements"
      ],
      escape: canQueue 
        ? `Will queue the operation (current queue size: ${queueSize || 0})`
        : "Operation will be retried after a brief delay",
      severity,
      category: "memory",
      operation,
      recoveryStrategy: canQueue ? "cache" : "retry",
      canRecover: true,
      recoveryHint: canQueue ? "Operation queued" : "Will retry shortly",
      additionalData: { currentConcurrency, maxConcurrency, queueSize, canQueue }
    });
  }
}
