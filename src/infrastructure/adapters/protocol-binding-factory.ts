import type {ProtocolType} from "./protocol-type.js"
import type {
	ChannelBindingsObject,
	MessageBindingsObject,
	OperationBindingsObject,
	ServerBindingsObject,
} from "@asyncapi/parser/esm/spec-types/v3.js"
import {KafkaProtocolBinding} from "./kafka-protocol-binding.js"
import {type KafkaChannelBindingConfig} from "./protocol-bindings.js"
import {WebSocketProtocolBinding} from "./web-socket-protocol-binding.js"
import {HttpProtocolBinding} from "./http-protocol-binding.js"

/**
 * Protocol Binding Factory - Creates standard AsyncAPI binding objects
 */
export class ProtocolBindingFactory {
	/**
	 * Create server bindings using standard AsyncAPI format
	 */
	static createServerBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): ServerBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createServerBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create channel bindings using standard AsyncAPI format
	 */
	static createChannelBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): ChannelBindingsObject | undefined {
		switch (protocol) {
			case "kafka": {
				const kafkaConfig = config.topic ? config as KafkaChannelBindingConfig & {
					topic: string
				} : {topic: "default-topic", ...config}
				return {
					kafka: KafkaProtocolBinding.createChannelBinding(kafkaConfig),
				}
			}
			case "ws":
			case "websocket":
				return {
					ws: WebSocketProtocolBinding.createChannelBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create operation bindings using standard AsyncAPI format
	 */
	static createOperationBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): OperationBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createOperationBinding(config),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createOperationBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create message bindings using standard AsyncAPI format
	 */
	static createMessageBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): MessageBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createMessageBinding(config),
				}
			case "ws":
			case "websocket":
				return {
					ws: WebSocketProtocolBinding.createMessageBinding(config),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createMessageBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Validate protocol binding configuration (simplified for now)
	 */
	static validateBinding(_protocol: ProtocolType, _bindingType: string, _config: Record<string, unknown>): {
		isValid: boolean;
		errors: string[];
		warnings: string[]
	} {
		// Basic validation - can be enhanced with proper schema validation
		return {
			isValid: true,
			errors: [],
			warnings: [],
		}
	}
}