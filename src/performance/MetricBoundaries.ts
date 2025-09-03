/**
 * Metric Boundaries Constants
 *
 * Centralizes all hardcoded performance metric boundaries that were
 * previously scattered throughout the codebase. These serve as defaults
 * and can be overridden by environment-specific configurations.
 */

import type {IMetricBoundaries, EnvironmentType} from "./IPerformanceConfig.js"

/**
 * Default metric boundaries extracted from hardcoded values
 * These represent the original "arbitrary" values that need to be made configurable
 */
export const DEFAULT_BOUNDARIES: IMetricBoundaries = {
  // Originally hardcoded in metrics.ts as "COMPLETELY ARBITRARY"
  throughputBoundaries: [10, 25, 50, 100, 200, 500, 1000, 2000] as const,
  
  // Originally hardcoded in metrics.ts as "PULLED OUT OF THIN AIR"
  memoryBoundaries: [256, 512, 1024, 2048, 4096, 8192] as const,
  
  // Originally hardcoded in metrics.ts as "COMPLETELY MADE UP"
  latencyBoundaries: [10, 25, 50, 100, 250, 500, 1000, 2500] as const,
  
  // Originally hardcoded in metrics.ts initialization metric
  initializationBoundaries: [100, 250, 500, 1000, 2000, 5000, 10000] as const,
}

/**
 * Development environment boundaries - More forgiving for local development
 */
export const DEVELOPMENT_BOUNDARIES: IMetricBoundaries = {
  // Lower throughput expectations for development
  throughputBoundaries: [1, 5, 10, 25, 50, 100, 200, 500] as const,
  
  // Higher memory tolerance for debugging/verbose logging
  memoryBoundaries: [512, 1024, 2048, 4096, 8192, 16384, 32768] as const,
  
  // Higher latency tolerance for non-optimized dev builds
  latencyBoundaries: [50, 100, 250, 500, 1000, 2500, 5000, 10000] as const,
  
  // Longer initialization times acceptable in dev
  initializationBoundaries: [500, 1000, 2000, 5000, 10000, 20000, 30000] as const,
}

/**
 * Staging environment boundaries - Closer to production but with some tolerance
 */
export const STAGING_BOUNDARIES: IMetricBoundaries = {
  // Production-like throughput with slight tolerance
  throughputBoundaries: [5, 15, 35, 75, 150, 350, 750, 1500] as const,
  
  // Production-like memory with monitoring buffer
  memoryBoundaries: [384, 768, 1536, 3072, 6144, 12288] as const,
  
  // Production-like latency with monitoring buffer
  latencyBoundaries: [20, 40, 80, 150, 300, 600, 1200, 3000] as const,
  
  // Slightly more relaxed initialization for staging
  initializationBoundaries: [200, 400, 800, 1500, 3000, 7500, 15000] as const,
}

/**
 * Production environment boundaries - Optimized for production performance
 */
export const PRODUCTION_BOUNDARIES: IMetricBoundaries = {
  // High-performance production throughput expectations
  throughputBoundaries: [25, 50, 100, 250, 500, 1000, 2500, 5000] as const,
  
  // Strict memory boundaries for production efficiency
  memoryBoundaries: [128, 256, 512, 1024, 2048, 4096] as const,
  
  // Strict latency requirements for production SLA
  latencyBoundaries: [5, 10, 25, 50, 100, 200, 500, 1000] as const,
  
  // Fast initialization requirements for production
  initializationBoundaries: [50, 100, 250, 500, 1000, 2500, 5000] as const,
}

/**
 * Get environment-specific boundaries
 */
export const getBoundariesForEnvironment = (environment: EnvironmentType): IMetricBoundaries => {
  switch (environment) {
    case 'development':
      return DEVELOPMENT_BOUNDARIES
    case 'staging':
      return STAGING_BOUNDARIES
    case 'production':
      return PRODUCTION_BOUNDARIES
    default:
      return DEFAULT_BOUNDARIES
  }
}

/**
 * Validate that boundaries are in ascending order and have minimum count
 */
export const validateBoundaries = (boundaries: IMetricBoundaries): {isValid: boolean; errors: string[]} => {
  const errors: string[] = []
  
  const validateArray = (arr: readonly number[], name: string) => {
    if (arr.length < 2) {
      errors.push(`${name} boundaries must have at least 2 values`)
      return
    }
    
    for (let i = 1; i < arr.length; i++) {
      const current = arr[i]
      const previous = arr[i - 1]
      if (current === undefined || previous === undefined || current <= previous) {
        errors.push(`${name} boundaries must be in ascending order`)
        break
      }
    }
    
    if (arr.some(v => v <= 0)) {
      errors.push(`${name} boundaries must be positive numbers`)
    }
  }
  
  validateArray(boundaries.throughputBoundaries, "Throughput")
  validateArray(boundaries.memoryBoundaries, "Memory")
  validateArray(boundaries.latencyBoundaries, "Latency")
  validateArray(boundaries.initializationBoundaries, "Initialization")
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Create custom boundaries with validation
 */
export const createCustomBoundaries = (
  base: IMetricBoundaries,
  overrides: Partial<IMetricBoundaries>
): IMetricBoundaries => {
  const boundaries = {
    ...base,
    ...overrides,
  }
  
  const validation = validateBoundaries(boundaries)
  if (!validation.isValid) {
    throw new Error(`Invalid metric boundaries: ${validation.errors.join(', ')}`)
  }
  
  return boundaries
}
