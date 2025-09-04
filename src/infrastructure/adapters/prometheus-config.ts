import type {MetricDefinition} from "./metric-definition.js"

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