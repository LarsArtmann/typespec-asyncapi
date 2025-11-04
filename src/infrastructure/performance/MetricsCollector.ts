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

import { Effect, Context, Layer, Data } from "effect"
import type { ServiceMetrics } from "../../domain/models/ServiceInterfaces.js"

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
  readonly endTiming: (operation: string) => Effect.Effect<PerformanceMetrics, never>
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
      const timers = globalThis.__ASYNCAPI_TIMERS ||= new Map<string, number>()
      timers.set(operation, performance.now())
    }),
  
  endTiming: (operation: string) => 
    Effect.gen(function* () {
      const timers = globalThis.__ASYNCAPI_TIMERS ||= new Map<string, number>()
      const startTime = timers.get(operation)
      
      if (!startTime) {
        yield* Effect.logWarning(`⚠️ No start time found for operation: ${operation}`)
        return null
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      timers.delete(operation)
      
      // Type-safe memory usage calculation
      let memoryUsageMB = 0
      if (typeof performance !== "undefined") {
        // Browser performance API
        const perf = performance as unknown
        if (typeof perf === "object" && perf !== null) {
          // Check for memory API in browser
          const memoryAPI = (perf as Record<string, unknown>).memory
          if (typeof memoryAPI === "object" && memoryAPI !== null) {
            const usedJSHeapSize = (memoryAPI as Record<string, unknown>).usedJSHeapSize
            if (typeof usedJSHeapSize === "number") {
              memoryUsageMB = usedJSHeapSize / 1024 / 1024
            }
          }
        }
      }
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS ||= { hits: 0, misses: 0 }
      const documentsProcessed = globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED ||= 0
      
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        operation,
        duration,
        memoryUsage,
        cacheHits: cacheMetrics.hits,
        cacheMisses: cacheMetrics.misses,
        documentsProcessed
      }
      
      yield* MemoryMetricsCollector.recordMetrics(metrics)
      return metrics
    }),
  
  recordMetrics: (metrics: PerformanceMetrics) =>
    Effect.sync(() => {
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY ||= []
      metricsHistory.push(metrics)
      
      // Keep only last 1000 metrics to prevent memory leaks
      if (metricsHistory.length > 1000) {
        metricsHistory.splice(0, metricsHistory.length - 1000)
      }
    }),
  
  getMetrics: (operation?: string) =>
    Effect.sync(() => {
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY ||= []
      return operation 
        ? metricsHistory.filter(m => m.operation === operation)
        : [...metricsHistory]
    }),
  
  getAggregatedMetrics: () =>
    Effect.sync(() => {
      const metricsHistory = globalThis.__ASYNCAPI_METRICS_HISTORY ||= []
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS ||= { hits: 0, misses: 0 }
      
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
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS ||= { hits: 0, misses: 0 }
      cacheMetrics.hits++
    }),
  
  /**
   * Record cache miss
   */
  recordCacheMiss: () =>
    Effect.sync(() => {
      const cacheMetrics = globalThis.__ASYNCAPI_CACHE_METRICS ||= { hits: 0, misses: 0 }
      cacheMetrics.misses++
    }),
  
  /**
   * Increment documents processed counter
   */
  incrementDocumentsProcessed: () =>
    Effect.sync(() => {
      globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED = (globalThis.__ASYNCAPI_DOCUMENTS_PROCESSED || 0) + 1
    })
}
