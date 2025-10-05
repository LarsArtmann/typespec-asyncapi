/**
 * Shared type imports for protocol decorators
 * Eliminates import duplication across protocol.ts and protocolConfig.ts
 */
export type {KafkaBindingConfig} from "./kafkaBindingConfig.js"
export type {HttpBindingConfig} from "./httpBindingConfig.js"
export type {AMQPBindingConfig} from "./AMQPBindingConfig.js"
export type {MQTTBindingConfig} from "./MQTTBindingConfig.js"
export type {RedisBindingConfig} from "./redisBindingConfig.js"
export type {WebSocketBindingConfig} from "./webSocketBindingConfig.js"
export type {ProtocolType} from "./protocolType.js"
