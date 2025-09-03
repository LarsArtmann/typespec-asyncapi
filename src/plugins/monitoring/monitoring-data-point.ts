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