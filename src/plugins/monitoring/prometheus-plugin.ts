/**
 * Prometheus Monitoring Plugin
 * 
 * Provides Prometheus metrics collection with custom metrics, labels,
 * and push gateway support for generated applications.
 */

import { Effect } from "effect"
import type {
    MonitoringPlugin,
    PrometheusConfig,
    MonitoringDataPoint,
    MetricDefinition,
    MetricType
} from "./monitoring-plugin-types.js"
import { MonitoringType } from "./monitoring-plugin-types.js"

/**
 * Prometheus metrics collector and exporter
 */
class PrometheusCollector {
    private config: PrometheusConfig = {}
    private metrics = new Map<string, MonitoringDataPoint[]>()
    private server: any = null // HTTP server for metrics endpoint
    
    initialize(config: PrometheusConfig): Effect.Effect<void, Error> {
        return Effect.gen(function* () {
            this.config = {
                endpoint: config.endpoint || '/metrics',
                port: config.port || 8080,
                path: config.path || '/metrics', 
                namespace: config.namespace || 'app',
                labels: config.labels || {},
                customMetrics: config.customMetrics || [],
                pushGateway: config.pushGateway
            }
            
            yield* Effect.log(`=� Prometheus plugin initialized with namespace: ${this.config.namespace}`)
            yield* Effect.log(`=� Metrics endpoint: ${this.config.endpoint}:${this.config.port}${this.config.path}`)
            
            if (this.config.pushGateway) {
                yield* Effect.log(`=� Push Gateway configured: ${this.config.pushGateway.url}`)
            }
            
            if (this.config.customMetrics && this.config.customMetrics.length > 0) {
                yield* Effect.log(`=� Custom metrics defined: ${this.config.customMetrics.length}`)
            }
        }.bind(this))
    }
    
    /**
     * Record a metric data point
     */
    recordMetric(dataPoint: MonitoringDataPoint): Effect.Effect<void, Error> {
        return Effect.gen(function* () {
            const metricName = `${this.config.namespace}_${dataPoint.metric}`
            
            if (!this.metrics.has(metricName)) {
                this.metrics.set(metricName, [])
            }
            
            const metrics = this.metrics.get(metricName)!
            metrics.push({
                ...dataPoint,
                timestamp: new Date(),
                labels: { ...this.config.labels, ...dataPoint.labels }
            })
            
            // Keep only last 1000 data points per metric
            if (metrics.length > 1000) {
                metrics.splice(0, metrics.length - 1000)
            }
            
            yield* Effect.log(`=� Recorded metric: ${metricName} = ${dataPoint.value}`)
        }.bind(this))
    }
    
    /**
     * Get all current metrics
     */
    getMetrics(): Effect.Effect<MonitoringDataPoint[], Error> {
        return Effect.gen(function* () {
            const allMetrics: MonitoringDataPoint[] = []
            
            for (const [metricName, dataPoints] of this.metrics.entries()) {
                allMetrics.push(...dataPoints)
            }
            
            yield* Effect.log(`=� Retrieved ${allMetrics.length} metric data points`)
            return allMetrics
        }.bind(this))
    }
    
    /**
     * Generate Prometheus exposition format
     */
    generatePrometheusFormat(): Effect.Effect<string, Error> {
        return Effect.gen(function* () {
            let output = ''
            
            for (const [metricName, dataPoints] of this.metrics.entries()) {
                if (dataPoints.length === 0) continue
                
                const latestPoint = dataPoints[dataPoints.length - 1]
                const metricType = this.getMetricTypeFromName(metricName)
                
                // Add metric type and help
                output += `# TYPE ${metricName} ${metricType}\n`
                output += `# HELP ${metricName} Generated metric from TypeSpec application\n`
                
                // Add metric value with labels
                const labelsStr = this.formatLabels(latestPoint.labels || {})
                output += `${metricName}${labelsStr} ${latestPoint.value} ${latestPoint.timestamp.getTime()}\n`
            }
            
            return output
        }.bind(this))
    }
    
    private getMetricTypeFromName(name: string): string {
        // Simple heuristics for metric types
        if (name.includes('_total') || name.includes('_count')) return 'counter'
        if (name.includes('_duration') || name.includes('_latency')) return 'histogram'
        if (name.includes('_size') || name.includes('_memory')) return 'gauge'
        return 'gauge' // Default
    }
    
    private formatLabels(labels: Record<string, string>): string {
        const labelPairs = Object.entries(labels)
        if (labelPairs.length === 0) return ''
        
        const formattedPairs = labelPairs.map(([key, value]) => `${key}="${value}"`)
        return `{${formattedPairs.join(',')}}`
    }
}

/**
 * Prometheus Monitoring Plugin Implementation
 */
export const prometheusPlugin: MonitoringPlugin = {
    name: "prometheus-monitoring",
    version: "1.0.0",
    type: MonitoringType.PROMETHEUS,
    dependencies: [],
    
    initialize: (config: unknown) => Effect.gen(function* () {
        const collector = new PrometheusCollector()
        
        if (typeof config !== 'object' || !config) {
            return yield* Effect.fail(new Error("Invalid Prometheus configuration"))
        }
        
        yield* collector.initialize(config as PrometheusConfig)
        yield* Effect.log("=� Prometheus Monitoring Plugin initialized")
    }),
    
    start: () => Effect.gen(function* () {
        yield* Effect.log("� Prometheus Monitoring Plugin started")
        // In a real implementation, start HTTP server for metrics endpoint
    }),
    
    stop: () => Effect.gen(function* () {
        yield* Effect.log("� Prometheus Monitoring Plugin stopped")
        // In a real implementation, stop HTTP server
    }),
    
    recordMetric: (dataPoint: MonitoringDataPoint) => {
        const collector = new PrometheusCollector()
        return collector.recordMetric(dataPoint)
    },
    
    getMetrics: () => {
        const collector = new PrometheusCollector()
        return collector.getMetrics()
    },
    
    validateConfig: (config: unknown) => Effect.gen(function* () {
        if (typeof config !== 'object' || !config) {
            return false
        }
        
        const promConfig = config as PrometheusConfig
        
        // Validate port if specified
        if (promConfig.port && (promConfig.port < 1 || promConfig.port > 65535)) {
            return false
        }
        
        // Validate push gateway configuration
        if (promConfig.pushGateway) {
            try {
                new URL(promConfig.pushGateway.url)
            } catch {
                return false
            }
            
            if (!promConfig.pushGateway.jobName || promConfig.pushGateway.interval <= 0) {
                return false
            }
        }
        
        return true
    }),
    
    generateSetupCode: (runtime: 'go' | 'nodejs', config: unknown) => Effect.gen(function* () {
        const promConfig = config as PrometheusConfig
        
        if (runtime === 'go') {
            return `
// Prometheus Monitoring Setup for Go
package monitoring

import (
    "fmt"
    "net/http"
    "time"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "github.com/prometheus/client_golang/prometheus/push"
)

type PrometheusConfig struct {
    Endpoint     string            \`json:"endpoint"\`
    Port         int               \`json:"port"\`
    Path         string            \`json:"path"\`
    Namespace    string            \`json:"namespace"\`
    Labels       map[string]string \`json:"labels"\`
    PushGateway  *PushGatewayConfig \`json:"push_gateway"\`
}

type PushGatewayConfig struct {
    URL      string \`json:"url"\`
    JobName  string \`json:"job_name"\`
    Interval int    \`json:"interval"\`
}

var (
    promConfig = PrometheusConfig{
        Endpoint:  "${promConfig.endpoint || '/metrics'}",
        Port:      ${promConfig.port || 8080},
        Path:      "${promConfig.path || '/metrics'}",
        Namespace: "${promConfig.namespace || 'app'}",
        Labels: map[string]string{
            ${Object.entries(promConfig.labels || {}).map(([k, v]) => `"${k}": "${v}"`).join(',\n            ')}
        },
        ${promConfig.pushGateway ? `PushGateway: &PushGatewayConfig{
            URL:      "${promConfig.pushGateway.url}",
            JobName:  "${promConfig.pushGateway.jobName}",
            Interval: ${promConfig.pushGateway.interval},
        },` : 'PushGateway: nil,'}
    }
    
    // Default metrics
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: promConfig.Namespace,
            Name:      "requests_total",
            Help:      "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
    
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: promConfig.Namespace,
            Name:      "request_duration_seconds",
            Help:      "HTTP request duration in seconds",
            Buckets:   prometheus.DefBuckets,
        },
        []string{"method", "endpoint"},
    )
    
    activeConnections = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: promConfig.Namespace,
            Name:      "active_connections",
            Help:      "Number of active connections",
        },
        []string{"type"},
    )
)

func init() {
    // Register metrics
    prometheus.MustRegister(requestsTotal)
    prometheus.MustRegister(requestDuration)
    prometheus.MustRegister(activeConnections)
}

// StartMetricsServer starts the Prometheus metrics HTTP server
func StartMetricsServer() error {
    http.Handle(promConfig.Path, promhttp.Handler())
    
    fmt.Printf("=� Starting Prometheus metrics server on :%d%s\\n", 
        promConfig.Port, promConfig.Path)
    
    // Start push gateway routine if configured
    if promConfig.PushGateway != nil {
        go pushMetricsRoutine()
    }
    
    return http.ListenAndServe(fmt.Sprintf(":%d", promConfig.Port), nil)
}

// pushMetricsRoutine periodically pushes metrics to push gateway
func pushMetricsRoutine() {
    ticker := time.NewTicker(time.Duration(promConfig.PushGateway.Interval) * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        pusher := push.New(promConfig.PushGateway.URL, promConfig.PushGateway.JobName)
        
        for k, v := range promConfig.Labels {
            pusher = pusher.Grouping(k, v)
        }
        
        if err := pusher.Push(); err != nil {
            fmt.Printf("L Failed to push metrics to gateway: %v\\n", err)
        }
    }
}

// RecordRequest records HTTP request metrics
func RecordRequest(method, endpoint string, status int, duration time.Duration) {
    requestsTotal.WithLabelValues(method, endpoint, fmt.Sprintf("%d", status)).Inc()
    requestDuration.WithLabelValues(method, endpoint).Observe(duration.Seconds())
}

// SetActiveConnections sets the number of active connections
func SetActiveConnections(connType string, count int) {
    activeConnections.WithLabelValues(connType).Set(float64(count))
}

// Custom metric creation helpers
func CreateCounter(name, help string, labels []string) *prometheus.CounterVec {
    counter := prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: promConfig.Namespace,
            Name:      name,
            Help:      help,
        },
        labels,
    )
    prometheus.MustRegister(counter)
    return counter
}

func CreateGauge(name, help string, labels []string) *prometheus.GaugeVec {
    gauge := prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Namespace: promConfig.Namespace,
            Name:      name,
            Help:      help,
        },
        labels,
    )
    prometheus.MustRegister(gauge)
    return gauge
}
`
        } else if (runtime === 'nodejs') {
            return `
// Prometheus Monitoring Setup for Node.js (Express)
const promClient = require('prom-client');
const express = require('express');
const http = require('http');

const promConfig = {
    endpoint: '${promConfig.endpoint || '/metrics'}',
    port: ${promConfig.port || 8080},
    path: '${promConfig.path || '/metrics'}',
    namespace: '${promConfig.namespace || 'app'}',
    labels: ${JSON.stringify(promConfig.labels || {})},
    pushGateway: ${promConfig.pushGateway ? JSON.stringify(promConfig.pushGateway) : 'null'}
};

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ 
    register,
    prefix: promConfig.namespace + '_'
});

// Custom metrics
const requestsTotal = new promClient.Counter({
    name: promConfig.namespace + '_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'endpoint', 'status'],
    registers: [register]
});

const requestDuration = new promClient.Histogram({
    name: promConfig.namespace + '_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'endpoint'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register]
});

const activeConnections = new promClient.Gauge({
    name: promConfig.namespace + '_active_connections',
    help: 'Number of active connections',
    labelNames: ['type'],
    registers: [register]
});

// Middleware for automatic request tracking
function prometheusMiddleware(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const endpoint = req.route ? req.route.path : req.path;
        
        requestsTotal.inc({
            method: req.method,
            endpoint: endpoint,
            status: res.statusCode
        });
        
        requestDuration.observe({
            method: req.method,
            endpoint: endpoint
        }, duration);
    });
    
    next();
}

// Start metrics server
function startMetricsServer() {
    const app = express();
    
    // Metrics endpoint
    app.get(promConfig.path, async (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });
    
    const server = http.createServer(app);
    server.listen(promConfig.port, () => {
        console.log(\`=� Prometheus metrics server listening on port \${promConfig.port}\${promConfig.path}\`);
    });
    
    // Setup push gateway if configured
    if (promConfig.pushGateway) {
        setupPushGateway();
    }
    
    return server;
}

// Push gateway setup
function setupPushGateway() {
    const gateway = new promClient.Pushgateway(promConfig.pushGateway.url, [], register);
    
    setInterval(() => {
        gateway.pushAdd({
            jobName: promConfig.pushGateway.jobName,
            groupings: promConfig.labels
        }).catch(err => {
            console.error('L Failed to push metrics to gateway:', err.message);
        });
    }, promConfig.pushGateway.interval * 1000);
    
    console.log(\`=� Push Gateway configured: \${promConfig.pushGateway.url}\`);
}

// Helper functions
function recordRequest(method, endpoint, status, duration) {
    requestsTotal.inc({ method, endpoint, status: status.toString() });
    requestDuration.observe({ method, endpoint }, duration);
}

function setActiveConnections(type, count) {
    activeConnections.set({ type }, count);
}

// Custom metric creation helpers
function createCounter(name, help, labelNames = []) {
    const counter = new promClient.Counter({
        name: promConfig.namespace + '_' + name,
        help: help,
        labelNames: labelNames,
        registers: [register]
    });
    return counter;
}

function createGauge(name, help, labelNames = []) {
    const gauge = new promClient.Gauge({
        name: promConfig.namespace + '_' + name,
        help: help,
        labelNames: labelNames,
        registers: [register]
    });
    return gauge;
}

function createHistogram(name, help, labelNames = [], buckets = undefined) {
    const histogram = new promClient.Histogram({
        name: promConfig.namespace + '_' + name,
        help: help,
        labelNames: labelNames,
        buckets: buckets,
        registers: [register]
    });
    return histogram;
}

module.exports = {
    startMetricsServer,
    prometheusMiddleware,
    recordRequest,
    setActiveConnections,
    createCounter,
    createGauge,
    createHistogram,
    register
};
`
        } else {
            return yield* Effect.fail(new Error(`Unsupported runtime: ${runtime}`))
        }
    }),
    
    generateConfigFiles: () => Effect.gen(function* () {
        const files: Record<string, string> = {}
        
        // Prometheus configuration file
        files['prometheus.yml'] = `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'typespec-app'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '${(config as PrometheusConfig).path || '/metrics'}'
    scrape_interval: 30s

  - job_name: 'pushgateway'
    static_configs:
      - targets: ['localhost:9091']
    honor_labels: true

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093
`
        
        // Docker Compose for Prometheus stack
        files['docker-compose.prometheus.yml'] = `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  pushgateway:
    image: prom/pushgateway:latest
    container_name: pushgateway
    ports:
      - "9091:9091"

volumes:
  prometheus_data: {}
`
        
        return files
    }),
    
    generateDocs: () => Effect.gen(function* () {
        return `
# Prometheus Monitoring

This service integrates Prometheus metrics collection for comprehensive application monitoring.

## Metrics Endpoint

Access metrics at: \`${(config as PrometheusConfig).endpoint || 'http://localhost:8080'}${(config as PrometheusConfig).path || '/metrics'}\`

## Default Metrics

The following metrics are automatically collected:

### HTTP Metrics
- \`${(config as PrometheusConfig).namespace || 'app'}_requests_total\` - Total HTTP requests (counter)
- \`${(config as PrometheusConfig).namespace || 'app'}_request_duration_seconds\` - HTTP request duration (histogram)

### System Metrics  
- \`${(config as PrometheusConfig).namespace || 'app'}_active_connections\` - Active connections (gauge)
- Process and runtime metrics (memory, CPU, GC, etc.)

## Custom Metrics

Add custom metrics using the provided helper functions:

### Go Example
\`\`\`go
// Create custom counter
userLoginCounter := CreateCounter("user_logins_total", "Total user logins", []string{"status"})
userLoginCounter.WithLabelValues("success").Inc()

// Create custom gauge
queueSizeGauge := CreateGauge("queue_size", "Current queue size", []string{"queue_name"})
queueSizeGauge.WithLabelValues("processing").Set(42)
\`\`\`

### Node.js Example
\`\`\`javascript
// Create custom counter
const userLoginCounter = createCounter('user_logins_total', 'Total user logins', ['status']);
userLoginCounter.inc({ status: 'success' });

// Create custom gauge
const queueSizeGauge = createGauge('queue_size', 'Current queue size', ['queue_name']);
queueSizeGauge.set({ queue_name: 'processing' }, 42);
\`\`\`

## Configuration

- **Namespace**: \`${(config as PrometheusConfig).namespace || 'app'}\`
- **Port**: \`${(config as PrometheusConfig).port || 8080}\`
- **Path**: \`${(config as PrometheusConfig).path || '/metrics'}\`
- **Labels**: ${JSON.stringify((config as PrometheusConfig).labels || {})}

${(config as PrometheusConfig).pushGateway ? `
## Push Gateway

Metrics are automatically pushed to: \`${(config as PrometheusConfig).pushGateway!.url}\`
- **Job Name**: \`${(config as PrometheusConfig).pushGateway!.jobName}\`
- **Interval**: \`${(config as PrometheusConfig).pushGateway!.interval}\` seconds
` : ''}

## Prometheus Queries

### Common Queries
\`\`\`promql
# Request rate per minute
rate(${(config as PrometheusConfig).namespace || 'app'}_requests_total[1m])

# Average response time
rate(${(config as PrometheusConfig).namespace || 'app'}_request_duration_seconds_sum[5m]) / 
rate(${(config as PrometheusConfig).namespace || 'app'}_request_duration_seconds_count[5m])

# 95th percentile response time  
histogram_quantile(0.95, rate(${(config as PrometheusConfig).namespace || 'app'}_request_duration_seconds_bucket[5m]))

# Error rate
rate(${(config as PrometheusConfig).namespace || 'app'}_requests_total{status=~"5.."}[5m])
\`\`\`

## Alerting Rules

Example alerting rules for Prometheus:

\`\`\`yaml
groups:
- name: ${(config as PrometheusConfig).namespace || 'app'}_alerts
  rules:
  - alert: HighErrorRate
    expr: rate(${(config as PrometheusConfig).namespace || 'app'}_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    annotations:
      summary: "High error rate detected"
      
  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(${(config as PrometheusConfig).namespace || 'app'}_request_duration_seconds_bucket[5m])) > 1.0
    for: 5m
    annotations:
      summary: "High latency detected"
\`\`\`
`
    })
}

// Export plugin metadata for registry
export const prometheusPluginMetadata = {
    name: "prometheus-monitoring",
    version: "1.0.0",
    type: MonitoringType.PROMETHEUS,
    supportedRuntimes: ['go', 'nodejs'] as const,
    configSchema: {
        type: 'object',
        properties: {
            endpoint: { 
                type: 'string', 
                description: 'Base endpoint URL for metrics server',
                default: '/metrics'
            },
            port: { 
                type: 'integer',
                minimum: 1,
                maximum: 65535,
                description: 'Port for metrics HTTP server',
                default: 8080
            },
            path: { 
                type: 'string', 
                description: 'Path for metrics endpoint',
                default: '/metrics'
            },
            namespace: { 
                type: 'string', 
                description: 'Namespace prefix for all metrics',
                default: 'app'
            },
            labels: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'Global labels applied to all metrics'
            },
            customMetrics: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { 
                            type: 'string',
                            enum: ['counter', 'gauge', 'histogram', 'summary']
                        },
                        description: { type: 'string' },
                        labels: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    },
                    required: ['name', 'type', 'description']
                },
                description: 'Custom metric definitions'
            },
            pushGateway: {
                type: 'object',
                properties: {
                    url: { 
                        type: 'string',
                        format: 'uri',
                        description: 'Push Gateway URL'
                    },
                    jobName: { 
                        type: 'string',
                        description: 'Job name for push gateway'
                    },
                    interval: { 
                        type: 'integer',
                        minimum: 1,
                        description: 'Push interval in seconds'
                    }
                },
                required: ['url', 'jobName', 'interval'],
                description: 'Push Gateway configuration for batch jobs'
            }
        }
    },
    description: 'Prometheus metrics collection with custom metrics and push gateway support',
    examples: [
        {
            name: 'Basic Prometheus Setup',
            config: {
                port: 8080,
                namespace: 'myapp',
                labels: {
                    'environment': 'production',
                    'version': '1.0.0'
                }
            }
        },
        {
            name: 'Prometheus with Push Gateway',
            config: {
                port: 9090,
                namespace: 'batch_job',
                pushGateway: {
                    url: 'http://pushgateway:9091',
                    jobName: 'data_processing',
                    interval: 30
                }
            }
        }
    ],
    tags: ['metrics', 'observability', 'monitoring', 'prometheus']
}