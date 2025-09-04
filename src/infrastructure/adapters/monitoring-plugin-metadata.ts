import type {MonitoringType} from "./monitoring-type.js"

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