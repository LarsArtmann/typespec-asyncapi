/**
 * Default Configuration Constants
 *
 * Centralized default values for emitter configuration, file operations, and TypeSpec settings.
 * This replaces hardcoded configuration values throughout the codebase.
 */

/**
 * Default emitter configuration values
 */
export const DEFAULT_CONFIG = {
  /** Default output file name (without extension) */
  OUTPUT_FILE: "asyncapi",
  /** Default file type for output */
  FILE_TYPE: "yaml",
  /** Library name for TypeSpec */
  LIBRARY_NAME: "@lars-artmann/typespec-asyncapi",
} as const;

/**
 * Default TypeSpec emitter options
 */
export const DEFAULT_EMITTER_OPTIONS = {
  /** Default output file name */
  "output-file": "asyncapi",
  /** Default file type */
  "file-type": "yaml",
} as const;

/**
 * Default server configuration values
 */
export const DEFAULT_SERVER_CONFIG = {
  /** Default server name when none specified */
  NAME: "default",
  /** Default host when none specified */
  HOST: "localhost",
  /** Default protocol when none specified */
  PROTOCOL: "http",
} as const;

/**
 * Default message configuration values
 */
export const DEFAULT_MESSAGE_CONFIG = {
  /** Default content type for messages */
  CONTENT_TYPE: "application/json",
  /** Default schema format */
  SCHEMA_FORMAT: "application/vnd.aai.asyncapi+json;version=3.0.0",
} as const;

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG = {
  /** Whether to validate AsyncAPI specs by default */
  VALIDATE_SPEC: true,
  /** Whether to fail on validation warnings */
  FAIL_ON_WARNINGS: false,
  /** Default validation timeout in milliseconds */
  TIMEOUT_MS: 5000,
} as const;

/**
 * Performance and timing constants
 */
export const PERFORMANCE_CONSTANTS = {
  /** Default timeout for operations (10 seconds) */
  DEFAULT_TIMEOUT_MS: 10000,
  /** Timeout for validation operations (30 seconds) */
  VALIDATION_TIMEOUT_MS: 30000,
  /** Base delay for exponential backoff retry */
  RETRY_BASE_DELAY_MS: 100,
  /** Default maximum retry attempts */
  MAX_RETRY_ATTEMPTS: 3,
  /** Memory reporting: bytes in KB */
  BYTES_PER_KB: 1024,
  /** Memory reporting: bytes in MB */
  BYTES_PER_MB: 1024 * 1024,
  /** Memory reporting: bytes in GB */
  BYTES_PER_GB: 1024 * 1024 * 1024,
  /** Default memory threshold in MB */
  DEFAULT_MEMORY_THRESHOLD_MB: 512,
  /** Performance report decimal precision */
  REPORT_PRECISION: 2,
  /** Leak suspicion score multiplier */
  LEAK_SCORE_MULTIPLIER: 100,
} as const;

/**
 * Performance Monitoring Constants - Based on Industry Standards
 *
 * These constants are based on established performance engineering standards:
 * - GC Efficiency: Below 60% needs attention, above 80% is good
 * - Memory Fragmentation: Above 70% requires optimization
 * - Memory Per Operation: 1-4KB typical, >16KB problematic
 * - Leak Detection: Consistent growth rate >1MB/min suspicious
 * - Throughput: Percentiles based on production baselines
 */
export const PERFORMANCE_MONITORING = {
  /** Metrics history limit to prevent memory leaks (1000 entries) */
  METRICS_HISTORY_LIMIT: 1000,

  /** Performance regression thresholds */
  DEGRADATION_THRESHOLD: 0.1, // 10% degradation threshold
  IMPROVEMENT_THRESHOLD: 0.05, // 5% improvement threshold
  PERCENTAGE_MULTIPLIER: 100, // For percentage calculations

  /** Development configuration thresholds */
  DEV_MAX_COMPILATION_TIME_MS: 10000, // 10 seconds for dev
  DEV_MAX_MEMORY_USAGE_MB: 200, // 200MB for dev
  DEV_MIN_THROUGHPUT_OPS_PER_SEC: 5, // 5 ops/sec for dev
  DEV_MAX_LATENCY_MS: 2000, // 2 seconds for dev

  /** CI/CD configuration thresholds (stricter) */
  CI_MAX_COMPILATION_TIME_MS: 5000, // 5 seconds for CI
  CI_MAX_MEMORY_USAGE_MB: 100, // 100MB for CI
  CI_MIN_THROUGHPUT_OPS_PER_SEC: 10, // 10 ops/sec for CI
  CI_MAX_LATENCY_MS: 1000, // 1 second for CI

  /** Industry-standard GC efficiency thresholds */
  GC_EFFICIENCY_POOR_THRESHOLD: 0.6, // Below 60% needs attention
  GC_EFFICIENCY_GOOD_THRESHOLD: 0.8, // Above 80% is good

  /** Industry-standard memory fragmentation thresholds */
  FRAGMENTATION_HIGH_THRESHOLD: 0.7, // Above 70% requires optimization

  /** Memory per operation thresholds (bytes) */
  MEMORY_PER_OP_TYPICAL_MIN: 1024, // 1KB typical minimum
  MEMORY_PER_OP_TYPICAL_MAX: 4096, // 4KB typical maximum
  MEMORY_PER_OP_PROBLEMATIC: 16384, // >16KB problematic

  /** Memory leak detection thresholds */
  LEAK_DETECTION_GROWTH_RATE_PER_MIN: 1048576, // 1MB/min suspicious growth

  /** Memory leak scoring weights */
  LEAK_SCORE_STEADY_GROWTH_WEIGHT: 0.4, // 40% weight for steady growth
  LEAK_SCORE_FRAGMENTATION_WEIGHT: 0.3, // 30% weight for fragmentation
  LEAK_SCORE_MEMORY_PER_OP_WEIGHT: 0.3, // 30% weight for memory per operation
} as const;

/**
 * File extension mappings
 */
export const FILE_EXTENSIONS = {
  /** YAML file extensions */
  YAML: [".yaml", ".yml"],
  /** JSON file extensions */
  JSON: [".json"],
  /** TypeScript file extensions */
  TYPESCRIPT: [".ts", ".tsx"],
  /** TypeSpec file extensions */
  TYPESPEC: [".tsp"],
} as const;

/**
 * Default file type mapping
 */
export const DEFAULT_FILE_TYPES = {
  yaml: "yaml",
  json: "json",
  yml: "yaml",
} as const;
