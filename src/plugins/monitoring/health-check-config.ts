import type {HealthCheck} from "./health-check.js"

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