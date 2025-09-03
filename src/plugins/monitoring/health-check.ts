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