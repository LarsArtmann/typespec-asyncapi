// Protocol binding type unions for better type safety
export type ProtocolType =
	| 'http'
	| 'ws'
	| 'kafka'
	| 'anypointmq'
	| 'amqp'
	| 'amqp1'
	| 'mqtt'
	| 'mqtt5'
	| 'nats'
	| 'jms'
	| 'sns'
	| 'sqs'
	| 'stomp'
	| 'redis'
	| 'mercure'
	| 'ibmmq'
	| 'googlepubsub';