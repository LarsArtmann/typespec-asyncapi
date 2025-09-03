/**
 * Plugin processing result containing generated bindings and metadata
 */
export type IPluginResult = {
	/** Generated protocol bindings */
	readonly bindings: Record<string, unknown>

	/** Additional metadata for validation/documentation */
	readonly metadata?: Record<string, unknown>

	/** Dependencies on other plugins (for ordering) */
	readonly dependencies?: string[]

	/** Whether this result should be cached */
	readonly cacheable?: boolean
}