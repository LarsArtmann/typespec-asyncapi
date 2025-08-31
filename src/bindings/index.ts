/**
 * Protocol Bindings Index
 *
 * Currently supported bindings:
 * - Kafka (essential features only)
 *
 * NOT YET SUPPORTED (planned for future releases):
 * - AMQP bindings
 * - WebSocket bindings
 * - HTTP bindings
 * - MQTT bindings
 * - Redis Pub/Sub bindings
 * - Google Pub/Sub bindings
 * - Amazon SNS/SQS bindings
 */

//No re-exports! Use the real thing!

/**
 * Supported protocol binding types
 */
export type SupportedProtocolBindings = 'kafka';

/**
 * Check if a protocol binding is supported
 */
export function isSupportedProtocolBinding(protocol: string): protocol is SupportedProtocolBindings {
	return protocol in getSupportedProtocolBindings()
}

/**
 * Get list of supported protocol bindings
 */
export function getSupportedProtocolBindings(): SupportedProtocolBindings[] {
	return ['kafka']
}

/**
 * Get list of planned but not yet implemented protocol bindings
 */
export function getPlannedProtocolBindings(): string[] {
	return [
		'amqp',
		'websocket',
		'http',
		'mqtt',
		'redis',
		'googlepubsub',
		'sns',
		'sqs',
	]
}