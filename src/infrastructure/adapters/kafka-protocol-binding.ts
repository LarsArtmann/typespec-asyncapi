import type {KafkaServerBinding} from "./kafka-server-binding.js"
import type {KafkaChannelBinding} from "./kafka-channel-binding.js"
import type {KafkaOperationBinding} from "./kafka-operation-binding.js"
import type {KafkaMessageBinding} from "./kafka-message-binding.js"
import type {
	KafkaChannelBindingConfig,
	KafkaMessageBindingConfig,
	KafkaOperationBindingConfig,
} from "./protocol-bindings.js"

/**
 * Protocol Binding Builders - Generate standard AsyncAPI bindings
 * TODO: MAGIC NUMBERS!
 */
export class KafkaProtocolBinding {
	static createServerBinding(config: Partial<KafkaServerBinding> = {}): KafkaServerBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createChannelBinding(config: KafkaChannelBindingConfig & { topic: string }): KafkaChannelBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createOperationBinding(config: KafkaOperationBindingConfig = {}): KafkaOperationBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createMessageBinding(config: KafkaMessageBindingConfig = {}): KafkaMessageBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}
}