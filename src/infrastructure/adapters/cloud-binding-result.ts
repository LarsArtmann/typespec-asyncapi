/**
 * Result of cloud binding processing
 * TODO: NO unnamed types!!!
 */
export type CloudBindingResult = {
	/** AsyncAPI channel bindings */
	bindings: Record<string, Record<string, unknown>>

	/** Generated or modified channels */
	channels: Record<string, {
		address?: string
		description?: string
		bindings?: Record<string, unknown>
		messages?: Record<string, unknown>
	}>

	/** Generated or modified operations */
	operations: Record<string, {
		action: 'send' | 'receive'
		channel: { $ref: string }
		bindings?: Record<string, unknown>
		messages?: Array<{ $ref: string }>
	}>

	/** Additional components (schemas, security, etc.) */
	components: Record<string, unknown>
}