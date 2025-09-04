/**
 * WebSocket message binding data structure
 */
export type WebSocketMessageBinding = {
	method?: string
	query?: Record<string, unknown>
	headers?: Record<string, unknown>
	bindingVersion?: string
}