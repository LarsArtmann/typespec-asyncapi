//TODO: Split this into it's own file!
export type WebSocketBindingConfig = {
	/** WebSocket method (GET only for WebSocket upgrade) */
	method?: "GET";
	/** Query parameters schema */
	query?: Record<string, unknown>;
	/** Headers schema */
	headers?: Record<string, unknown>;
	/** Subprotocol */
	subprotocol?: string;
}