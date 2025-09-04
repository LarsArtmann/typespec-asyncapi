/**
 * Performance Configuration Interface
 *
 * Defines configurable performance metrics and boundaries to replace
 * hardcoded values throughout the system. Supports environment-specific
 * settings and runtime configuration updates.
 */

export type EnvironmentType = 'development' | 'staging' | 'production'

/**
 * Core performance metric boundaries configuration
 */
export type IMetricBoundaries = {
  /** Throughput histogram boundaries (operations per second) */
  throughputBoundaries: readonly number[]
  
  /** Memory usage histogram boundaries (bytes per operation) */
  memoryBoundaries: readonly number[]
  
  /** Latency histogram boundaries (microseconds) */
  latencyBoundaries: readonly number[]
  
  /** Initialization time boundaries (milliseconds) */
  initializationBoundaries: readonly number[]
}

/**
 * Performance target thresholds for validation
 */
export type IPerformanceTargets = {
  /** Target throughput (operations per second) */
  throughputTarget: number
  
  /** Target memory usage (bytes per operation) */
  memoryTarget: number
  
  /** Target latency (microseconds) */
  latencyTarget: number
  
  /** Memory threshold multiplier for warnings */
  memoryWarningMultiplier: number
}

/**
 * Monitoring and reporting configuration
 */
export type IMonitoringConfig = {
  /** Continuous monitoring interval (milliseconds) */
  monitoringIntervalMs: number
  
  /** Memory check frequency during batch operations */
  memoryCheckFrequency: number
  
  /** Enable detailed performance logging */
  enableDetailedLogging: boolean
  
  /** Enable performance regression detection */
  enableRegressionDetection: boolean
}

/**
 * Complete performance configuration interface
 */
export type IPerformanceConfig = {
  /** Current deployment environment */
  environment: EnvironmentType
  
  /** Metric boundary configurations */
  boundaries: IMetricBoundaries
  
  /** Performance target thresholds */
  targets: IPerformanceTargets
  
  /** Monitoring and reporting settings */
  monitoring: IMonitoringConfig
  
  /** Configuration version for validation */
  version: string
  
  /** Last updated timestamp */
  lastUpdated: string
}

/**
 * Default configurations for different environments
 */
export type IEnvironmentConfigs = {
  development: IPerformanceConfig
  staging: IPerformanceConfig
  production: IPerformanceConfig
}

/**
 * Configuration validation result
 */
export type IConfigValidationResult = {
  /** Whether configuration is valid */
  isValid: boolean
  
  /** Validation errors if any */
  errors: string[]
  
  /** Validation warnings if any */
  warnings: string[]
}

/**
 * Configuration update options
 */
export type IConfigUpdateOptions = {
  /** Whether to validate before applying */
  validate?: boolean
  
  /** Whether to merge with existing config or replace entirely */
  merge?: boolean
  
  /** Whether to persist changes to file */
  persist?: boolean
}
