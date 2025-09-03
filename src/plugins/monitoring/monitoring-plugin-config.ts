import type {PrometheusConfig} from "./prometheus-config.js"
import type {GrafanaConfig} from "./grafana-config.js"
import type {LoggingConfig} from "./logging-config.js"
import type {HealthCheckConfig} from "./health-check-config.js"

import type {MonitoringType} from "./monitoring-type.js"

/**
 * Individual plugin configuration within setup
 */
export type MonitoringPluginConfig = {
	readonly type: MonitoringType
	readonly config: PrometheusConfig | GrafanaConfig | LoggingConfig | HealthCheckConfig
	readonly enabled?: boolean
	readonly priority?: number
}