/**
 * Performance Metrics Collector - Production Monitoring Architecture
 * 
 * Provides comprehensive metrics collection for:
 * - Document generation performance
 * - TypeSpec compilation metrics  
 * - Plugin system efficiency
 * - Memory usage tracking
 * - Cache hit/miss ratios
 */

import { Effect, Context, Layer } from "effect"
import type { ServiceMetrics } from "../../domain/models/ServiceInterfaces.js"
import { PERFORMANCE_MONITORING } from "../../constants/defaults.js"
import { getMemoryUsageFromPerformance } from "../../utils/performance-utils.js"

/**
 * Shared utility to initialize and get cache metrics
 * Eliminates duplication across hit/miss recording functions
 */
const getCacheMetrics = (): { hits: number, misses: number } => {
	globalThis.__ASYNCAPI_CACHE_METRICS ??= { hits: 0, misses: 0 }
	return globalThis.__ASYNCAPI_CACHE_METRICS
}

/**
 * Performance metrics interface
 */
export type PerformanceMetrics = {
  readonly timestamp: number
  readonly operation: string
  readonly duration: number
  readonly memoryUsage: number
  readonly cacheHits: number
  readonly cacheMisses: number
  readonly documentsProcessed: number
}

/**
 * Metrics collector interface
 */
export type MetricsCollector = {
  readonly startTiming: (operation: string) => Effect.Effect<void, never>
  readonly endTiming: (operation: string) => Effect.Effect<PerformanceMetrics | null, never>
  readonly recordMetrics: (metrics: PerformanceMetrics) => Effect.Effect<void, never>
  readonly getMetrics: (operation?: string) => Effect.Effect<PerformanceMetrics[], never>
  readonly getAggregatedMetrics: () => Effect.Effect<ServiceMetrics, never>
}

/**
 * Metrics collector tag for dependency injection
 */
export const MetricsCollector = Context.GenericTag<"MetricsCollector", MetricsCollector>("MetricsCollector")

/**
 * In-memory metrics collector implementation
 */
export const MemoryMetricsCollector = {
  startTiming: (operation: string) => 
    Effect.sync(() => {
      globalThis.__ASYNCAPI_TIMERS ??= new Map<string, number>()
      const timers = globalThis.__ASYNCAPI_TIMERS
      timers.set(operation, performance.now())
    }),
  
  endTiming: (operation: string) => 
    Effect.gen(function* () {
      globalThis.__ASYNCAPI_TIMERS ??= new Map<string, number>()
      const timers = globalThis.__ASYNCAPI_TIMERS
      const startTime = timers.get(operation)
      
      if (!startTime) {
        yield* Effect.logWarning(`⚠️ No start time found for operation: ${operation}`)
        return null
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      timers.delete(operation)

      // Get memory usage from shared utility
      const memoryUsageMB = getMemoryUsageFromPerformance()

      globalThis.__ASYNCAPI_CACHE_METRICS ??= { hits: 0, misses: 0 }
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS
      globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED ??= 0
      const documentsProcessed = globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED
      
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        operation,
        duration,
        memoryUsage: memoryUsageMB,
        cacheHits: cacheMetrics.hits,
        cacheMisses: cacheMetrics.misses,
        documentsProcessed
      }
      
      yield* MemoryMetricsCollector.recordMetrics(metrics)
      return metrics
    }),
  
  recordMetrics: (metrics: PerformanceMetrics) =>
    Effect.sync(() => {
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY ??= []
      metricsHistory.push(metrics)
      
      // Keep only last METRICS_HISTORY_LIMIT metrics to prevent memory leaks
      if (metricsHistory.length > PERFORMANCE_MONITORING.METRICS_HISTORY_LIMIT) {
        metricsHistory.splice(0, metricsHistory.length - PERFORMANCE_MONITORING.METRICS_HISTORY_LIMIT)
      }
    }),
  
  getMetrics: (operation?: string) =>
    Effect.sync(() => {
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY ??= []
      return operation 
        ? metricsHistory.filter(m => m.operation === operation)
        : [...metricsHistory]
    }),
  
  getAggregatedMetrics: () =>
    Effect.sync(() => {
      globalThis.__ASYNCAPI_METRICS_HISTORY ??= []
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY
      globalThis.__ASYNCAPI_CACHE_METRICS ??= { hits: 0, misses: 0 }
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS
      
      if (metricsHistory.length === 0) {
        return {
          operations: 0,
          messageModels: 0,
          securityConfigs: 0,
          totalProcessed: 0,
          executionTime: 0,
          memoryUsage: 0,
          cacheHits: cacheMetrics.hits,
          cacheMisses: cacheMetrics.misses
        }
      }
      
      const operationCounts = metricsHistory.reduce((acc, m) => {
        acc[m.operation] = (acc[m.operation] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const totalDuration = metricsHistory.reduce((sum, m) => sum + m.duration, 0)
      const avgMemory = metricsHistory.reduce((sum, m) => sum + m.memoryUsage, 0) / metricsHistory.length
      
      return {
        operations: Object.keys(operationCounts).length,
        messageModels: operationCounts['message-generation'] || 0,
        securityConfigs: operationCounts['security-processing'] || 0,
        totalProcessed: metricsHistory.length,
        executionTime: Math.round(totalDuration),
        memoryUsage: Math.round(avgMemory),
        cacheHits: cacheMetrics.hits,
        cacheMisses: cacheMetrics.misses
      }
    })
}

/**
 * Metrics collector layer for dependency injection
 */
export const MetricsCollectorLive = Layer.succeed(MetricsCollector, MemoryMetricsCollector)

/**
 * Global type declarations for metrics storage
 */
declare global {
  var __ASYNCAPI_TIMERS: Map<string, number> | undefined
  var __ASYNCAPI_METRICS_HISTORY: PerformanceMetrics[] | undefined
  var __ASYNCAPI_CACHE_METRICS: { hits: number; misses: number } | undefined
  var __ASYNCAPI_DOCUMENTS_PROCESSED: number | undefined
}

/**
 * Performance monitoring helper utilities
 */
export const PerformanceMonitor = {
  /**
   * Measure execution time of an effect
   */
  measure: <A, E>(operation: string, effect: Effect.Effect<A, E>) =>
    Effect.gen(function* () {
      const metrics = yield* MetricsCollector
      
      yield* metrics.startTiming(operation)
      
      const result = yield* effect
      
      yield* metrics.endTiming(operation)
      return result
    }),
  
  /**
   * Record cache hit
   */
  recordCacheHit: () =>
    Effect.sync(() => {
      const cacheMetrics = getCacheMetrics()
      cacheMetrics.hits++
    }),
  
  /**
   * Record cache miss
   */
  recordCacheMiss: () =>
    Effect.sync(() => {
      const cacheMetrics = getCacheMetrics()
      cacheMetrics.misses++
    }),
  
  /**
   * Increment documents processed counter
   */
  incrementDocumentsProcessed: () =>
    Effect.sync(() => {
      globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED = (globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED ?? 0) + 1
    })
}
