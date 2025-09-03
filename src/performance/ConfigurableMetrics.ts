/**
 * Configurable Metrics Factory
 *
 * Replaces hardcoded metric boundaries with configurable, environment-aware
 * metric definitions. Implements dynamic metric creation based on performance
 * configuration.
 */

import {Metric, MetricBoundaries} from "effect"
import type {IPerformanceConfig, IMetricBoundaries} from "./IPerformanceConfig.js"

/**
 * Configurable performance metrics that adapt to environment settings
 */
export interface IConfigurableMetrics {
  /** Validation throughput histogram (ops/sec) */
  validationThroughput: Metric.Metric.Histogram
  
  /** Memory usage per operation histogram (bytes) */
  memoryPerOperation: Metric.Metric.Histogram
  
  /** Validation latency histogram (microseconds) */
  validationLatency: Metric.Metric.Histogram
  
  /** Emitter initialization time histogram (milliseconds) */
  initializationTime: Metric.Metric.Histogram
  
  /** Success counter */
  validationSuccess: Metric.Metric.Counter
  
  /** Failure counter */
  validationFailure: Metric.Metric.Counter
  
  /** Memory leak detection counter */
  memoryLeaks: Metric.Metric.Counter
  
  /** Performance target gauges */
  throughputTarget: Metric.Metric.Gauge
  memoryTarget: Metric.Metric.Gauge
}

/**
 * Factory for creating configurable metrics based on performance configuration
 */
export class ConfigurableMetricsFactory {
  private constructor(
    private readonly config: IPerformanceConfig
  ) {}

  /**
   * Create a new metrics factory with the given configuration
   */
  static create(config: IPerformanceConfig): ConfigurableMetricsFactory {
    return new ConfigurableMetricsFactory(config)
  }

  /**
   * Create performance metrics using configured boundaries
   */
  createMetrics(): IConfigurableMetrics {
    const {boundaries} = this.config

    return {
      validationThroughput: Metric.histogram(
        "validation_throughput_ops_per_sec",
        MetricBoundaries.fromIterable(boundaries.throughputBoundaries),
      ),

      memoryPerOperation: Metric.histogram(
        "memory_per_operation_bytes",
        MetricBoundaries.fromIterable(boundaries.memoryBoundaries),
      ),

      validationLatency: Metric.histogram(
        "validation_latency_microseconds",
        MetricBoundaries.fromIterable(boundaries.latencyBoundaries),
      ),

      initializationTime: Metric.histogram(
        "initialization_time_ms",
        MetricBoundaries.fromIterable(boundaries.initializationBoundaries),
      ),

      validationSuccess: Metric.counter("validation_success_total"),
      validationFailure: Metric.counter("validation_failure_total"),
      memoryLeaks: Metric.counter("memory_leaks_detected_total"),
      throughputTarget: Metric.gauge("throughput_target_ops_per_sec"),
      memoryTarget: Metric.gauge("memory_target_bytes_per_operation"),
    }
  }

  /**
   * Create metrics with custom boundaries (for testing)
   */
  createCustomMetrics(customBoundaries: Partial<IMetricBoundaries>): IConfigurableMetrics {
    const boundaries = {
      ...this.config.boundaries,
      ...customBoundaries,
    }

    return {
      validationThroughput: Metric.histogram(
        "validation_throughput_ops_per_sec",
        MetricBoundaries.fromIterable(boundaries.throughputBoundaries),
      ),

      memoryPerOperation: Metric.histogram(
        "memory_per_operation_bytes",
        MetricBoundaries.fromIterable(boundaries.memoryBoundaries),
      ),

      validationLatency: Metric.histogram(
        "validation_latency_microseconds",
        MetricBoundaries.fromIterable(boundaries.latencyBoundaries),
      ),

      initializationTime: Metric.histogram(
        "initialization_time_ms",
        MetricBoundaries.fromIterable(boundaries.initializationBoundaries),
      ),

      validationSuccess: Metric.counter("validation_success_total"),
      validationFailure: Metric.counter("validation_failure_total"),
      memoryLeaks: Metric.counter("memory_leaks_detected_total"),
      throughputTarget: Metric.gauge("throughput_target_ops_per_sec"),
      memoryTarget: Metric.gauge("memory_target_bytes_per_operation"),
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): IPerformanceConfig {
    return this.config
  }

  /**
   * Update configuration and return new factory instance
   */
  withConfig(newConfig: IPerformanceConfig): ConfigurableMetricsFactory {
    return new ConfigurableMetricsFactory(newConfig)
  }

  /**
   * Validate metric boundaries for sanity
   */
  validateBoundaries(): {isValid: boolean; errors: string[]} {
    const errors: string[] = []
    const {boundaries} = this.config

    // Check throughput boundaries are ascending
    if (!this.isAscending(boundaries.throughputBoundaries)) {
      errors.push("Throughput boundaries must be in ascending order")
    }

    // Check memory boundaries are ascending
    if (!this.isAscending(boundaries.memoryBoundaries)) {
      errors.push("Memory boundaries must be in ascending order")
    }

    // Check latency boundaries are ascending
    if (!this.isAscending(boundaries.latencyBoundaries)) {
      errors.push("Latency boundaries must be in ascending order")
    }

    // Check initialization boundaries are ascending
    if (!this.isAscending(boundaries.initializationBoundaries)) {
      errors.push("Initialization boundaries must be in ascending order")
    }

    // Check minimum boundary counts
    if (boundaries.throughputBoundaries.length < 2) {
      errors.push("Throughput boundaries must have at least 2 values")
    }

    if (boundaries.memoryBoundaries.length < 2) {
      errors.push("Memory boundaries must have at least 2 values")
    }

    if (boundaries.latencyBoundaries.length < 2) {
      errors.push("Latency boundaries must have at least 2 values")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private isAscending(values: readonly number[]): boolean {
    for (let i = 1; i < values.length; i++) {
      if (values[i] <= values[i - 1]) {
        return false
      }
    }
    return true
  }
}

/**
 * Utility function to create metrics factory from config
 */
export const createConfigurableMetrics = (config: IPerformanceConfig): IConfigurableMetrics => {
  return ConfigurableMetricsFactory.create(config).createMetrics()
}
