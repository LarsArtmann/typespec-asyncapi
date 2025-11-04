// Protocol type definition (from types/index.ts)
export type ProtocolType =
	| "kafka"
	| "websocket"
	| "http"
	| "mqtt"
	| "amqp"
	| "redis"
	| "nats"
	| "ws"
	| "https"

// Re-export as AsyncAPIProtocolType for compatibility
export type AsyncAPIProtocolType = ProtocolType