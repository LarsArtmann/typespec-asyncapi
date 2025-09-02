/**
 * Monitoring Plugin Types
 * 
 * Defines the core monitoring plugin architecture for generated applications.
 * Supports Prometheus metrics, Grafana dashboards, structured logging, and health checks.
 */

import type { Effect } from "effect"

export const MonitoringType = {
    PROMETHEUS: "prometheus",
    GRAFANA: "grafana", 
    LOGGING: "logging",
    HEALTH_CHECK: "health_check",
    TRACING: "tracing",
    CUSTOM: "custom"
} as const

export type MonitoringType = typeof MonitoringType[keyof typeof MonitoringType]

export const LogLevel = {
    TRACE: "trace",
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error",
    FATAL: "fatal"
} as const

export type LogLevel = typeof LogLevel[keyof typeof LogLevel]

export const MetricType = {
    COUNTER: "counter",
    GAUGE: "gauge",
    HISTOGRAM: "histogram",
    SUMMARY: "summary"
} as const

export type MetricType = typeof MetricType[keyof typeof MetricType]

/**
 * Prometheus monitoring configuration
 */
export type PrometheusConfig = {
    readonly endpoint?: string
    readonly port?: number
    readonly path?: string
    readonly namespace?: string
    readonly labels?: Record<string, string>
    readonly customMetrics?: MetricDefinition[]
    readonly pushGateway?: {
        url: string
        jobName: string
        interval: number
    }
}

/**
 * Grafana dashboard configuration
 */
export type GrafanaConfig = {
    readonly url: string
    readonly apiKey?: string
    readonly orgId?: number
    readonly dashboardTemplate?: string
    readonly datasource?: string
    readonly refreshInterval?: string
    readonly panels?: PanelDefinition[]
}

/**
 * Structured logging configuration
 */
export type LoggingConfig = {
    readonly level: LogLevel
    readonly format: 'json' | 'text' | 'structured'
    readonly output: 'console' | 'file' | 'syslog' | 'remote'
    readonly filePath?: string
    readonly maxFileSize?: string
    readonly maxFiles?: number
    readonly remoteEndpoint?: string
    readonly fields?: Record<string, unknown>
    readonly correlationId?: boolean
}

/**
 * Health check configuration
 */
export type HealthCheckConfig = {
    readonly endpoint?: string
    readonly interval?: number
    readonly timeout?: number
    readonly checks?: HealthCheck[]
    readonly gracefulShutdown?: boolean
    readonly readiness?: HealthCheck[]
    readonly liveness?: HealthCheck[]
}

/**
 * Metric definition for Prometheus
 */
export type MetricDefinition = {
    readonly name: string
    readonly type: MetricType
    readonly description: string
    readonly labels?: string[]
    readonly buckets?: number[] // For histograms
    readonly quantiles?: Record<string, number> // For summaries
}

/**
 * Grafana panel definition
 */
export type PanelDefinition = {
    readonly title: string
    readonly type: 'graph' | 'singlestat' | 'table' | 'heatmap'
    readonly query: string
    readonly xPos?: number
    readonly yPos?: number
    readonly width?: number
    readonly height?: number
}

/**
 * Health check definition
 */
export type HealthCheck = {
    readonly name: string
    readonly type: 'database' | 'redis' | 'http' | 'custom'
    readonly target?: string
    readonly timeout?: number
    readonly retries?: number
    readonly critical?: boolean
}

/**
 * Monitoring data point
 */
export type MonitoringDataPoint = {
    readonly timestamp: Date
    readonly metric: string
    readonly value: number | string | boolean
    readonly labels?: Record<string, string>
    readonly tags?: string[]
}

/**
 * Core monitoring plugin interface
 */
export type MonitoringPlugin = {
    readonly name: string
    readonly version: string
    readonly type: MonitoringType
    readonly dependencies: string[]
    
    /**
     * Initialize the monitoring plugin with configuration
     */
    initialize(config: unknown): Effect.Effect<void, Error>
    
    /**
     * Start the monitoring service
     */
    start(): Effect.Effect<void, Error>
    
    /**
     * Stop the monitoring service gracefully
     */
    stop(): Effect.Effect<void, Error>
    
    /**
     * Record a monitoring data point
     */
    recordMetric(dataPoint: MonitoringDataPoint): Effect.Effect<void, Error>
    
    /**
     * Get current monitoring metrics
     */
    getMetrics(): Effect.Effect<MonitoringDataPoint[], Error>
    
    /**
     * Validate monitoring configuration
     */
    validateConfig(config: unknown): Effect.Effect<boolean, Error>
    
    /**
     * Generate monitoring setup code for the target runtime
     */
    generateSetupCode(runtime: 'go' | 'nodejs', config: unknown): Effect.Effect<string, Error>
    
    /**
     * Generate monitoring configuration files
     */
    generateConfigFiles(): Effect.Effect<Record<string, string>, Error>
    
    /**
     * Generate monitoring documentation
     */
    generateDocs(): Effect.Effect<string, Error>
}

/**
 * Monitoring plugin metadata for the registry
 */
export type MonitoringPluginMetadata = {
    readonly name: string
    readonly version: string
    readonly type: MonitoringType
    readonly supportedRuntimes: ('go' | 'nodejs')[]
    readonly configSchema: Record<string, unknown>
    readonly description: string
    readonly examples: Record<string, unknown>[]
    readonly dependencies?: string[]
    readonly tags?: string[]
}

/**
 * Monitoring setup configuration for code generation
 */
export type MonitoringSetupConfig = {
    readonly plugins: MonitoringPluginConfig[]
    readonly globalConfig?: {
        serviceName?: string
        environment?: string
        version?: string
        labels?: Record<string, string>
    }
}

/**
 * Individual plugin configuration within setup
 */
export type MonitoringPluginConfig = {
    readonly type: MonitoringType
    readonly config: PrometheusConfig | GrafanaConfig | LoggingConfig | HealthCheckConfig
    readonly enabled?: boolean
    readonly priority?: number
}

/**
 * Monitoring event for plugin communication
 */
export type MonitoringEvent = {
    readonly type: 'metric' | 'log' | 'alert' | 'health'
    readonly timestamp: Date
    readonly source: string
    readonly data: unknown
    readonly severity?: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Monitoring query interface for retrieving metrics
 */
export type MonitoringQuery = {
    readonly metric?: string
    readonly labels?: Record<string, string>
    readonly timeRange?: {
        start: Date
        end: Date
    }
    readonly aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count'
    readonly groupBy?: string[]
}