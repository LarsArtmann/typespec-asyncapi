import type {KafkaBindingConfig, HttpBindingConfig, AMQPBindingConfig, MQTTBindingConfig, RedisBindingConfig, WebSocketBindingConfig, ProtocolType} from "./protocol-shared-types.js"

export type ProtocolConfig = {
	/** Protocol type */
	protocol: ProtocolType;
	/** Protocol-specific binding configuration */
	binding: KafkaBindingConfig | WebSocketBindingConfig | HttpBindingConfig | AMQPBindingConfig | MQTTBindingConfig | RedisBindingConfig;
	/** Additional protocol metadata */
	version?: string;
	/** Protocol description */
	description?: string;
}