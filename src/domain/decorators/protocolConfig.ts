<<<<<<< HEAD
import type {KafkaBindingConfig, HttpBindingConfig, AMQPBindingConfig, MQTTBindingConfig, RedisBindingConfig, WebSocketBindingConfig, ProtocolType} from "./protocol-shared-types.js"
=======
import type {KafkaBindingConfig} from "./kafkaBindingConfig.js"
import type {HttpBindingConfig} from "./httpBindingConfig.js"
import type {AMQPBindingConfig} from "./AMQPBindingConfig.js"
import type {MQTTBindingConfig} from "./MQTTBindingConfig.js"
import type {RedisBindingConfig} from "./redisBindingConfig.js"
import type {WebSocketBindingConfig} from "./webSocketBindingConfig.js"
import type {ProtocolType} from "./protocolType.js"
>>>>>>> master

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